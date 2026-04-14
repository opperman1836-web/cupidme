import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { duelService } from './duel.service';

function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url'); // 48-bit entropy, URL-safe
}

export class InviteService {
  // ── Create a shareable invite link ──
  async createInvite(inviterId: string, duelId: string) {
    // Verify the duel exists and user is a participant
    const { data: duel } = await supabaseAdmin
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single();

    if (!duel) throw new NotFoundError('Duel');
    if (duel.user1_id !== inviterId && duel.user2_id !== inviterId) {
      throw new AppError('Not a participant of this duel', 403);
    }

    // Get inviter profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('user_id', inviterId)
      .single();

    // Check if invite already exists for this duel+user
    const { data: existing } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('inviter_id', inviterId)
      .eq('duel_id', duelId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return existing;
    }

    const inviteCode = generateInviteCode();
    const myScore = duel.user1_id === inviterId ? duel.user1_score : duel.user2_score;

    const { data: invite, error } = await supabaseAdmin
      .from('invites')
      .insert({
        inviter_id: inviterId,
        invite_code: inviteCode,
        duel_id: duelId,
        inviter_display_name: profile?.display_name || 'Someone',
        duel_type: duel.type,
        compatibility_score: duel.compatibility_score,
        inviter_score: myScore,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message);

    // Update viral metrics
    await this.ensureMetrics(inviterId);

    const { data: metrics } = await supabaseAdmin
      .from('viral_metrics')
      .select('invites_sent')
      .eq('user_id', inviterId)
      .single();

    if (metrics) {
      await supabaseAdmin
        .from('viral_metrics')
        .update({ invites_sent: metrics.invites_sent + 1 })
        .eq('user_id', inviterId);
    }

    return invite;
  }

  // ── Get invite preview (PUBLIC - no auth needed) ──
  async getInvitePreview(inviteCode: string) {
    const { data: invite, error } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error || !invite) throw new NotFoundError('Invite');

    // Track click
    await supabaseAdmin
      .from('invites')
      .update({ click_count: invite.click_count + 1 })
      .eq('id', invite.id);

    // Get inviter photo
    const { data: photo } = await supabaseAdmin
      .from('user_photos')
      .select('url')
      .eq('user_id', invite.inviter_id)
      .eq('is_primary', true)
      .single();

    return {
      invite_code: invite.invite_code,
      inviter_name: invite.inviter_display_name,
      inviter_photo: photo?.url || null,
      duel_type: invite.duel_type,
      compatibility_score: invite.compatibility_score,
      inviter_score: invite.inviter_score,
      status: invite.status,
      created_at: invite.created_at,
    };
  }

  // ── Accept invite — creates account and starts duel ──
  async acceptInvite(
    inviteCode: string,
    input: { email: string; password: string; display_name: string },
    existingUserId?: string
  ) {
    const { data: invite } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('status', 'pending')
      .single();

    if (!invite) throw new AppError('Invalid or expired invite');

    if (new Date(invite.expires_at) < new Date()) {
      await supabaseAdmin
        .from('invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);
      throw new AppError('This invite has expired');
    }

    let userId = existingUserId;
    let accessToken: string | undefined;
    let isNewUser = false;

    if (!userId) {
      // Create new user account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      });

      if (authError) {
        // User might already exist — try login
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (loginError) throw new AppError('Email already registered. Please log in first.');

        userId = loginData.user.id;
        accessToken = loginData.session.access_token;
      } else {
        userId = authData.user.id;
        isNewUser = true;

        // Create user record (with upsert for safety)
        await supabaseAdmin.from('users').upsert({
          id: userId,
          email: input.email,
        }, { onConflict: 'id' });

        // Sign in to get token
        const { data: loginData } = await supabaseAdmin.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        accessToken = loginData?.session?.access_token;
      }
    }

    // Prevent self-accept
    if (userId === invite.inviter_id) {
      throw new AppError('Cannot accept your own invite');
    }

    // Mark invite as accepted (atomically check status to prevent double-accept)
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('invites')
      .update({
        status: 'accepted',
        invitee_id: userId,
        invitee_email: input.email,
        accepted_at: new Date().toISOString(),
        reward_claimed: true,
      })
      .eq('id', invite.id)
      .eq('status', 'pending') // Only update if still pending (prevents race condition)
      .select()
      .single();

    if (!updated) {
      throw new AppError('Invite already accepted or expired');
    }

    // ── Reward both users with +1 duel credit (only if reward not yet claimed) ──
    await this.rewardBothUsers(invite.inviter_id, userId!);

    // ── Track viral metrics ──
    await this.ensureMetrics(userId!);
    await this.ensureMetrics(invite.inviter_id);

    // Update inviter metrics
    const { data: inviterMetrics } = await supabaseAdmin
      .from('viral_metrics')
      .select('*')
      .eq('user_id', invite.inviter_id)
      .single();

    if (inviterMetrics) {
      await supabaseAdmin
        .from('viral_metrics')
        .update({ invites_accepted: inviterMetrics.invites_accepted + 1 })
        .eq('user_id', invite.inviter_id);
    }

    // Set referred_by for new user
    if (isNewUser) {
      // Get inviter's chain depth
      const { data: inviterChain } = await supabaseAdmin
        .from('viral_metrics')
        .select('chain_depth')
        .eq('user_id', invite.inviter_id)
        .single();

      await supabaseAdmin
        .from('viral_metrics')
        .update({
          referred_by: invite.inviter_id,
          chain_depth: (inviterChain?.chain_depth || 0) + 1,
        })
        .eq('user_id', userId!);
    }

    // Notify inviter
    await supabaseAdmin.from('notifications').insert({
      user_id: invite.inviter_id,
      type: 'system',
      title: 'Invite Accepted!',
      body: `${input.display_name} accepted your challenge! You both earned a free duel credit.`,
      data: { invitee_id: userId, invite_id: invite.id },
    });

    logger.info(`Invite ${inviteCode} accepted by ${userId}`);

    return {
      user_id: userId,
      access_token: accessToken,
      is_new_user: isNewUser,
      duel_id: invite.duel_id,
      reward: { credits: 1, message: 'You earned 1 free duel credit!' },
    };
  }

  // ── Accept invite for already-logged-in user ──
  async acceptInviteAuth(inviteCode: string, userId: string) {
    const { data: invite } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('status', 'pending')
      .single();

    if (!invite) throw new AppError('Invalid or expired invite');
    if (userId === invite.inviter_id) throw new AppError('Cannot accept your own invite');

    // Get user profile for the name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    // Mark accepted atomically
    const { data: updated } = await supabaseAdmin
      .from('invites')
      .update({
        status: 'accepted',
        invitee_id: userId,
        accepted_at: new Date().toISOString(),
        reward_claimed: true,
      })
      .eq('id', invite.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (!updated) {
      throw new AppError('Invite already accepted or expired');
    }

    // Reward both
    await this.rewardBothUsers(invite.inviter_id, userId);

    // Notify inviter
    await supabaseAdmin.from('notifications').insert({
      user_id: invite.inviter_id,
      type: 'system',
      title: 'Challenge Accepted!',
      body: `${profile?.display_name || 'Someone'} accepted your duel challenge! You both earned a free credit.`,
      data: { invitee_id: userId, invite_id: invite.id },
    });

    return {
      duel_id: invite.duel_id,
      reward: { credits: 1, message: 'You earned 1 free duel credit!' },
    };
  }

  // ── Track share event ──
  async trackShare(userId: string, duelId: string, platform: string) {
    await this.ensureMetrics(userId);

    const { data: metrics } = await supabaseAdmin
      .from('viral_metrics')
      .select('shares_count')
      .eq('user_id', userId)
      .single();

    if (metrics) {
      await supabaseAdmin
        .from('viral_metrics')
        .update({ shares_count: metrics.shares_count + 1 })
        .eq('user_id', userId);
    }

    logger.info(`Share tracked: user=${userId}, duel=${duelId}, platform=${platform}`);
  }

  // ── Get user viral stats ──
  async getViralStats(userId: string) {
    await this.ensureMetrics(userId);

    const { data: metrics } = await supabaseAdmin
      .from('viral_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get recent invites
    const { data: recentInvites } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get duel streak
    const { data: credits } = await supabaseAdmin
      .from('duel_credits')
      .select('total_duels_played, total_wins')
      .eq('user_id', userId)
      .single();

    return {
      metrics: metrics || { invites_sent: 0, invites_accepted: 0, shares_count: 0, duel_streak: 0, best_streak: 0, chain_depth: 0 },
      recent_invites: recentInvites || [],
      duel_stats: credits || { total_duels_played: 0, total_wins: 0 },
    };
  }

  // ── Private helpers ──

  private async rewardBothUsers(inviterId: string, inviteeId: string) {
    for (const uid of [inviterId, inviteeId]) {
      // Upsert with increment: if exists, add 1; if not, create with 2 (1 default + 1 reward)
      const { data: existing } = await supabaseAdmin
        .from('duel_credits')
        .select('credits')
        .eq('user_id', uid)
        .single();

      if (existing) {
        await supabaseAdmin
          .from('duel_credits')
          .update({ credits: existing.credits + 1 })
          .eq('user_id', uid)
          .eq('credits', existing.credits); // Optimistic concurrency
      } else {
        await supabaseAdmin
          .from('duel_credits')
          .upsert({ user_id: uid, credits: 2 }, { onConflict: 'user_id' });
      }
    }
  }

  private async ensureMetrics(userId: string) {
    const { data } = await supabaseAdmin
      .from('viral_metrics')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!data) {
      await supabaseAdmin
        .from('viral_metrics')
        .insert({ user_id: userId })
        .select()
        .single();
    }
  }
}

export const inviteService = new InviteService();
