import { supabaseAdmin } from '../config/supabase';
import { stripe } from '../config/stripe';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

// Timeout wrapper for any async call
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

// ── Scoring constants ──
// Per-question points come ONLY from speed (0-5). Compatibility points are
// awarded at completion (+20 per matching answer). This guarantees:
//   • Different answers produce different scores (compat bonus varies).
//   • Same answers produce different scores by speed.
//   • A user who picks slowly and never matches their opponent ends near 0.
//   • A user who picks fast and matches every answer ends near 125 (5*5 + 5*20).
const SPEED_POINTS_MAX     = 5;   // max per question from speed
const COMPATIBILITY_BONUS  = 20;  // per matching answer at completion

export class DuelService {
  // ── Create a duel ──
  // Non-practice duels start as 'pending' — opponent must explicitly accept
  // before either user can /start. Practice (self-) duels auto-accept.
  async createDuel(userId: string, input: {
    opponent_id?: string;
    match_id?: string;
    type?: string;
  }) {
    const opponentId = input.opponent_id;

    // Prevent self-duel via opponent_id (practice mode is requested by omitting opponent_id)
    if (opponentId && opponentId === userId) {
      throw new AppError('You cannot duel yourself. Use practice mode instead.');
    }

    if (!opponentId) {
      return this.createPracticeDuel(userId, input.type);
    }

    const { data: opponent } = await supabaseAdmin
      .from('users').select('id, is_active').eq('id', opponentId).single();

    if (!opponent || !opponent.is_active) throw new NotFoundError('Opponent');

    // Don't deduct a credit until the opponent accepts. Avoids burning credits
    // on declined invites. Deduction happens in acceptDuel() / startDuel().
    const { data: existing } = await supabaseAdmin
      .from('duels').select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${opponentId}),and(user1_id.eq.${opponentId},user2_id.eq.${userId})`)
      .in('status', ['pending', 'accepted', 'active']).limit(1);

    if (existing && existing.length > 0) {
      throw new AppError('You already have an active or pending duel with this user');
    }

    // Validate match_id ownership if provided
    if (input.match_id) {
      const userA = userId < opponentId ? userId : opponentId;
      const userB = userId < opponentId ? opponentId : userId;
      const { data: matchCheck } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('id', input.match_id)
        .eq('user_a_id', userA)
        .eq('user_b_id', userB)
        .single();
      if (!matchCheck) {
        throw new AppError('Invalid match for this duel');
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: duel, error } = await supabaseAdmin.from('duels').insert({
      user1_id: userId, user2_id: opponentId, match_id: input.match_id || null,
      type: input.type || 'compatibility', status: 'pending', total_questions: 5,
      expires_at: expiresAt.toISOString(),
    }).select().single();

    if (error) throw new AppError(error.message);

    // Notify opponent so they can accept/reject from their notifications.
    await supabaseAdmin.from('notifications').insert({
      user_id: opponentId,
      type: 'system',
      title: 'Duel Challenge!',
      body: 'Someone challenged you to a Cupid Duel — tap to accept.',
      data: { duel_id: duel.id, action: 'duel_invite' },
    }); // error ignored — non-critical

    return duel;
  }

  private async createPracticeDuel(userId: string, duelType?: string) {
    await this.deductCredit(userId);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Practice = self-duel; auto-accepted so /start works immediately.
    const now = new Date().toISOString();
    const { data: duel, error } = await supabaseAdmin.from('duels').insert({
      user1_id: userId, user2_id: userId,
      type: duelType || 'compatibility', status: 'accepted',
      accepted_at: now,
      total_questions: 5, expires_at: expiresAt.toISOString(),
    }).select().single();

    if (error) throw new AppError(error.message);
    return duel;
  }

  // ── Accept a duel invitation ──
  // Only the OPPONENT (user2_id) can accept. Deducts a credit from the inviter
  // because the duel is now real. Returns the updated duel.
  async acceptDuel(duelId: string, userId: string) {
    const { data: duel, error } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).single();
    if (error || !duel) throw new NotFoundError('Duel');
    if (duel.user2_id !== userId) {
      throw new AppError('Only the challenged user can accept this duel', 403);
    }
    if (duel.status === 'accepted' || duel.status === 'active') {
      return duel; // idempotent
    }
    if (duel.status !== 'pending') {
      throw new AppError(`Cannot accept a duel with status "${duel.status}"`);
    }

    // Deduct credit from inviter now that the duel is real
    await this.deductCredit(duel.user1_id);

    const now = new Date().toISOString();
    const { data: updated, error: upErr } = await supabaseAdmin
      .from('duels')
      .update({ status: 'accepted', accepted_at: now })
      .eq('id', duelId)
      .eq('status', 'pending') // optimistic concurrency
      .select().single();
    if (upErr) throw new AppError(upErr.message);
    if (!updated) {
      // Lost the race — return current state
      const { data: fresh } = await supabaseAdmin.from('duels').select('*').eq('id', duelId).single();
      return fresh;
    }

    // Notify inviter that opponent accepted
    await supabaseAdmin.from('notifications').insert({
      user_id: duel.user1_id, type: 'system',
      title: 'Duel Accepted!',
      body: 'Your opponent accepted — let the duel begin.',
      data: { duel_id: duelId, action: 'duel_accepted' },
    });

    return updated;
  }

  // ── Reject a duel invitation ──
  async rejectDuel(duelId: string, userId: string, reason?: string) {
    const { data: duel, error } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).single();
    if (error || !duel) throw new NotFoundError('Duel');
    if (duel.user2_id !== userId) {
      throw new AppError('Only the challenged user can reject this duel', 403);
    }
    if (duel.status === 'rejected' || duel.status === 'cancelled') return duel;
    if (duel.status !== 'pending') {
      throw new AppError(`Cannot reject a duel with status "${duel.status}"`);
    }

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('duels')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_reason: reason || null,
      })
      .eq('id', duelId).eq('status', 'pending')
      .select().single();
    if (upErr) throw new AppError(upErr.message);

    // Notify inviter
    await supabaseAdmin.from('notifications').insert({
      user_id: duel.user1_id, type: 'system',
      title: 'Duel declined',
      body: 'Your opponent declined the duel.',
      data: { duel_id: duelId, action: 'duel_rejected' },
    });

    return updated;
  }

  // ── Start duel ──
  // Requires status='accepted' (or 'active' to resume). Generates questions on
  // the first call; the second caller just gets the existing question set.
  async startDuel(duelId: string, userId: string) {
    const { data: duel, error } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).single();

    if (error || !duel) throw new NotFoundError('Duel');
    if (duel.user1_id !== userId && duel.user2_id !== userId) {
      throw new AppError('Not a participant of this duel', 403);
    }

    // Active — return existing questions
    if (duel.status === 'active') {
      const { data: questions } = await supabaseAdmin
        .from('duel_questions').select('*').eq('duel_id', duelId).order('question_number');
      return { duel, questions: questions || [] };
    }

    if (duel.status === 'completed') throw new AppError('This duel is already completed');
    if (duel.status === 'rejected')  throw new AppError('This duel was declined');
    if (duel.status === 'cancelled') throw new AppError('This duel was cancelled');
    if (duel.status === 'expired')   throw new AppError('This duel has expired');

    if (duel.status === 'pending') {
      throw new AppError('Waiting for your opponent to accept this duel');
    }

    if (duel.status !== 'accepted') {
      throw new AppError(`Cannot start a duel in status "${duel.status}"`);
    }

    // Atomically transition accepted → active (prevents double-init race)
    const { data: activated } = await supabaseAdmin
      .from('duels')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', duelId).eq('status', 'accepted')
      .select().single();

    if (!activated) {
      // Lost the race — another caller already activated it
      const { data: q } = await supabaseAdmin
        .from('duel_questions').select('*').eq('duel_id', duelId).order('question_number');
      const { data: d } = await supabaseAdmin.from('duels').select('*').eq('id', duelId).single();
      return { duel: d, questions: q || [] };
    }

    // Clear any stale questions (defensive)
    await supabaseAdmin.from('duel_questions').delete().eq('duel_id', duelId);

    // Generate questions — fallback guaranteed
    const questions = this.getFallbackQuestions(duel.total_questions);
    try {
      const aiQuestions = await this.generateQuestionsWithTimeout(duel.type, duel.total_questions);
      if (aiQuestions.length >= duel.total_questions) {
        questions.splice(0, questions.length, ...aiQuestions);
      }
    } catch {
      logger.error('AI question generation failed — using fallback questions');
    }

    const questionRows = questions.slice(0, duel.total_questions).map((q, i) => ({
      duel_id: duelId, question_number: i + 1,
      question_text: q.question, option_a: q.options[0], option_b: q.options[1],
      option_c: q.options[2] || null, option_d: q.options[3] || null,
      time_limit_seconds: duel.type === 'rapid_fire' ? 10 : 15,
      points: SPEED_POINTS_MAX,  // legacy column; actual scoring uses speed-only here
    }));

    const { error: insertError } = await supabaseAdmin.from('duel_questions').insert(questionRows);
    if (insertError) throw new AppError(insertError.message);

    const { data: savedQuestions } = await supabaseAdmin
      .from('duel_questions').select('*').eq('duel_id', duelId).order('question_number');

    return { duel: activated, questions: savedQuestions || [] };
  }

  // ── Submit answer ──
  // Per-question points = speed bonus only (0-5). Compatibility bonus is added
  // in completeDuel() after both users have answered every question.
  async submitAnswer(duelId: string, userId: string, input: {
    question_id: string; answer: string; answered_in_seconds?: number;
  }) {
    const { data: duel } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).eq('status', 'active').single();

    if (!duel) throw new NotFoundError('Active duel');
    if (duel.user1_id !== userId && duel.user2_id !== userId) {
      throw new AppError('Not a participant', 403);
    }

    const { data: question } = await supabaseAdmin
      .from('duel_questions').select('*').eq('id', input.question_id).eq('duel_id', duelId).single();
    if (!question) throw new NotFoundError('Question');

    // Idempotent — already-answered returns the existing record
    const { data: existingAnswer } = await supabaseAdmin
      .from('duel_answers').select('id, points_earned')
      .eq('question_id', input.question_id).eq('user_id', userId).single();

    if (existingAnswer) {
      return { answer: existingAnswer, points_earned: existingAnswer.points_earned, speed_bonus: 0 };
    }

    // Speed-only points: faster = more points, capped at SPEED_POINTS_MAX
    const limit = question.time_limit_seconds || 15;
    const timeUsed = Math.min(input.answered_in_seconds ?? limit, limit);
    const remainingFraction = Math.max(0, (limit - timeUsed) / limit);
    const speedBonus  = Math.round(remainingFraction * SPEED_POINTS_MAX);
    const pointsEarned = speedBonus; // no flat base — compatibility bonus comes later

    const { data: answer, error } = await supabaseAdmin.from('duel_answers').insert({
      duel_id: duelId, question_id: input.question_id, user_id: userId,
      answer: input.answer, answered_in_seconds: timeUsed, points_earned: pointsEarned,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        return { answer: null, points_earned: pointsEarned, speed_bonus: speedBonus };
      }
      throw new AppError(error.message);
    }

    // Increment running speed-points total on the duel row
    const scoreField = duel.user1_id === userId ? 'user1_score' : 'user2_score';
    await supabaseAdmin.from('duels').update({
      [scoreField]: (duel[scoreField as keyof typeof duel] as number) + pointsEarned,
      current_question: question.question_number,
    }).eq('id', duelId);

    return { answer, points_earned: pointsEarned, speed_bonus: speedBonus };
  }

  // ── Complete duel ──
  async completeDuel(duelId: string, userId: string) {
    const { data: duel } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).single();

    if (!duel) throw new NotFoundError('Duel');
    if (duel.user1_id !== userId && duel.user2_id !== userId) {
      throw new AppError('Not a participant', 403);
    }

    if (duel.status === 'completed') {
      return { status: 'completed', compatibility_score: duel.compatibility_score, ai_insight: duel.ai_insight };
    }

    const isPractice = duel.user1_id === duel.user2_id;

    if (isPractice) {
      await supabaseAdmin.from('duels')
        .update({ user1_completed: true, user2_completed: true }).eq('id', duelId);
    } else {
      const field = duel.user1_id === userId ? 'user1_completed' : 'user2_completed';
      await supabaseAdmin.from('duels').update({ [field]: true }).eq('id', duelId);
    }

    const { data: updated } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).single();

    if (!updated) throw new AppError('Duel not found');

    if (updated.user1_completed && updated.user2_completed) {
      // Real scoring: speed points (already in user1_score/user2_score)
      // + compatibility bonus (calculated from answer matching).
      const compatibility = await this.calculateCompatibility(duelId);

      // Award compatibility bonus to BOTH users — same answer → same bonus.
      const compatBonus = compatibility.matched_count * COMPATIBILITY_BONUS;
      const finalUser1Score = (updated.user1_score || 0) + compatBonus;
      const finalUser2Score = (updated.user2_score || 0) + compatBonus;

      await supabaseAdmin.from('duels').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        compatibility_score: compatibility.score,
        ai_insight: compatibility.insight,
        user1_score: finalUser1Score,
        user2_score: finalUser2Score,
      }).eq('id', duelId);

      if (isPractice) {
        const { data: cr } = await supabaseAdmin.from('duel_credits').select('*').eq('user_id', userId).single();
        if (cr) await supabaseAdmin.from('duel_credits').update({ total_duels_played: cr.total_duels_played + 1 }).eq('user_id', userId);
      } else {
        await this.updateDuelStats({ ...duel, user1_score: finalUser1Score, user2_score: finalUser2Score });
      }

      if (duel.match_id) {
        await supabaseAdmin.from('relationship_events').insert({
          match_id: duel.match_id, event_type: 'challenge_passed',
          score_deltas: { trust: 5, chemistry: 10, depth: 5 },
        });
      }

      return {
        status: 'completed',
        compatibility_score: compatibility.score,
        ai_insight: compatibility.insight,
        compatibility_bonus: compatBonus,
        matched_count: compatibility.matched_count,
        total_questions: compatibility.total_questions,
        final_user1_score: finalUser1Score,
        final_user2_score: finalUser2Score,
      };
    }

    return { status: 'waiting_for_opponent' };
  }

  // ── Get duel ──
  async getDuel(duelId: string, userId: string) {
    const { data: duel, error } = await supabaseAdmin
      .from('duels').select('*').eq('id', duelId).single();

    if (error || !duel) throw new NotFoundError('Duel');
    if (duel.user1_id !== userId && duel.user2_id !== userId) {
      throw new AppError('Not a participant', 403);
    }

    const { data: duelQuestions } = await supabaseAdmin
      .from('duel_questions').select('*').eq('duel_id', duelId).order('question_number');

    const userIds = duel.user1_id === duel.user2_id ? [duel.user1_id] : [duel.user1_id, duel.user2_id];
    const { data: profiles } = await supabaseAdmin
      .from('profiles').select('user_id, display_name, city').in('user_id', userIds);

    const { data: myAnswers } = await supabaseAdmin
      .from('duel_answers').select('*').eq('duel_id', duelId).eq('user_id', userId);

    let opponentAnswers: any[] = [];
    if (duel.status === 'completed' && duel.user1_id !== duel.user2_id) {
      const opId = duel.user1_id === userId ? duel.user2_id : duel.user1_id;
      const { data: oa } = await supabaseAdmin
        .from('duel_answers').select('*').eq('duel_id', duelId).eq('user_id', opId);
      opponentAnswers = oa || [];
    }

    let suggestedVenues: any[] = [];
    if (duel.status === 'completed' && duel.user1_id !== duel.user2_id) {
      suggestedVenues = await this.getSuggestedVenues(duel.user1_id, duel.user2_id);
    }

    return { ...duel, duel_questions: duelQuestions || [], profiles: profiles || [],
      my_answers: myAnswers || [], opponent_answers: opponentAnswers, suggested_venues: suggestedVenues };
  }

  // ── User's duels ──
  async getUserDuels(userId: string) {
    const { data, error } = await supabaseAdmin.from('duels').select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false }).limit(20);

    if (error) throw new AppError(error.message);

    return await Promise.all((data || []).map(async (duel) => {
      if (duel.user1_id === duel.user2_id) {
        return { ...duel, opponent: { id: null, display_name: 'Practice Mode', city: null } };
      }
      const opId = duel.user1_id === userId ? duel.user2_id : duel.user1_id;
      const { data: p } = await supabaseAdmin.from('profiles').select('display_name, city').eq('user_id', opId).single();
      // Mark whether the current user is the inviter or invitee — frontend uses
      // this to decide whether to show "accept/reject" or "waiting for response"
      return {
        ...duel,
        opponent: { id: opId, display_name: p?.display_name || 'Unknown', city: p?.city },
        i_am_inviter: duel.user1_id === userId,
        i_am_invitee: duel.user2_id === userId,
      };
    }));
  }

  // Pending invitations TO the user — for the "incoming duels" UI
  async getPendingInvites(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('duels')
      .select('*')
      .eq('user2_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new AppError(error.message);

    if (!data || data.length === 0) return [];

    const inviterIds = [...new Set(data.map((d: any) => d.user1_id))];
    const [profilesRes, photosRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('user_id, display_name, city').in('user_id', inviterIds),
      supabaseAdmin.from('user_photos').select('user_id, url, position').in('user_id', inviterIds).order('position'),
    ]);

    const profileBy = new Map<string, any>();
    (profilesRes.data || []).forEach((p: any) => profileBy.set(p.user_id, p));
    const primaryPhotoBy = new Map<string, string>();
    (photosRes.data || []).forEach((ph: any) => {
      if (!primaryPhotoBy.has(ph.user_id)) primaryPhotoBy.set(ph.user_id, ph.url);
    });

    return data.map((duel: any) => {
      const p = profileBy.get(duel.user1_id);
      return {
        ...duel,
        inviter: {
          id: duel.user1_id,
          display_name: p?.display_name || 'Unknown',
          city: p?.city || null,
          primary_photo_url: primaryPhotoBy.get(duel.user1_id) || null,
        },
      };
    });
  }

  // ── Credits ──
  async getCredits(userId: string) {
    const { data } = await supabaseAdmin.from('duel_credits').select('*').eq('user_id', userId).single();
    if (!data) {
      const { data: n, error } = await supabaseAdmin.from('duel_credits')
        .upsert({ user_id: userId, credits: 1 }, { onConflict: 'user_id' }).select().single();
      if (error) {
        logger.error('Failed to create credits', error);
        return { credits: 1, total_duels_played: 0, total_wins: 0, last_free_claim: null };
      }
      return n;
    }
    return data;
  }

  async claimFreeCredit(userId: string) {
    const credits = await this.getCredits(userId);
    const now = new Date();

    if (credits.last_free_claim) {
      const last = new Date(credits.last_free_claim);
      const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (days < 30) throw new AppError(`Next free credit available on ${new Date(last.getTime() + 30*24*60*60*1000).toLocaleDateString()}`);
    }

    const { data, error } = await supabaseAdmin.from('duel_credits')
      .update({ credits: credits.credits + 1, last_free_claim: now.toISOString() })
      .eq('user_id', userId).select().single();

    if (error) throw new AppError(error.message);
    return data;
  }

  async purchaseCredits(userId: string, packageType: string) {
    const packages: Record<string, { credits: number; name: string; amount: number }> = {
      '5_credits': { credits: 5, name: '5 Duel Credits', amount: 4900 },
      '20_credits': { credits: 20, name: '20 Duel Credits', amount: 14900 },
    };
    const pkg = packages[packageType];
    if (!pkg) throw new AppError('Invalid credit package');

    const { data: sub } = await supabaseAdmin.from('subscriptions')
      .select('stripe_customer_id').eq('user_id', userId).limit(1).single();
    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', userId).single();
      const customer = await stripe.customers.create({ email: user?.email, metadata: { user_id: userId } });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId, mode: 'payment',
      line_items: [{ price_data: { currency: 'zar', product_data: { name: pkg.name }, unit_amount: pkg.amount }, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/duel/invite?credits=purchased`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/duel/invite?credits=cancelled`,
      metadata: { user_id: userId, type: 'duel_credits', credits: pkg.credits.toString() },
    });

    return { session_id: session.id, url: session.url };
  }

  async handleCreditPurchase(userId: string, creditsToAdd: number) {
    if (creditsToAdd <= 0 || creditsToAdd > 100) {
      throw new AppError('Invalid credit amount');
    }
    const credits = await this.getCredits(userId);
    const { error } = await supabaseAdmin
      .from('duel_credits')
      .update({ credits: credits.credits + creditsToAdd })
      .eq('user_id', userId)
      .eq('credits', credits.credits);

    if (error) {
      const retryCredits = await this.getCredits(userId);
      await supabaseAdmin
        .from('duel_credits')
        .update({ credits: retryCredits.credits + creditsToAdd })
        .eq('user_id', userId);
    }
    logger.info(`Added ${creditsToAdd} credits for user ${userId}`);
  }

  // ── Private helpers ──

  private async deductCredit(userId: string) {
    const credits = await this.getCredits(userId);
    if (credits.total_duels_played === 0) return; // first duel free
    if (credits.credits <= 0) throw new AppError('No duel credits remaining. Purchase credits or claim your monthly free credit.');
    const { error } = await supabaseAdmin
      .from('duel_credits')
      .update({ credits: credits.credits - 1 })
      .eq('user_id', userId)
      .eq('credits', credits.credits);
    if (error) throw new AppError('Credit deduction failed, please retry');
  }

  private async generateQuestionsWithTimeout(duelType: string, count: number) {
    const { claude } = await import('../config/claude');
    const typePrompts: Record<string, string> = {
      compatibility: 'relationship compatibility and shared values',
      icebreaker: 'fun getting-to-know-you topics',
      deep_connection: 'deep emotional and life philosophy topics',
      fun: 'light-hearted and playful scenarios',
      rapid_fire: 'quick preference and "this or that" choices',
    };
    const topic = typePrompts[duelType] || typePrompts.compatibility;

    const aiCall = claude.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 2000,
      messages: [{ role: 'user', content: `Generate ${count} dating compatibility quiz questions about ${topic}. Each must have: "question" (max 100 chars), "options" (exactly 4 short answers). Return JSON array only.` }],
    });

    const message = await withTimeout(aiCall, 5000);
    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length < count) throw new Error('Invalid AI response');
    return parsed.slice(0, count);
  }

  private getFallbackQuestions(count: number) {
    const pool = [
      { question: 'What matters most in a relationship?', options: ['Trust', 'Passion', 'Communication', 'Adventure'] },
      { question: 'Perfect date night?', options: ['Cozy dinner at home', 'Fancy restaurant', 'Outdoor adventure', 'Live music/show'] },
      { question: 'How do you handle disagreements?', options: ['Talk it out calmly', 'Take space first', 'Find compromise', 'Write it down'] },
      { question: "What's your love language?", options: ['Words of affirmation', 'Quality time', 'Physical touch', 'Acts of service'] },
      { question: 'Weekend plans?', options: ['Sleep in & brunch', 'Explore somewhere new', 'Hobbies at home', 'Social gathering'] },
      { question: 'Dealbreaker in a partner?', options: ['Dishonesty', 'No ambition', 'Poor communication', 'Different values'] },
      { question: 'How soon to say "I love you"?', options: ['When you feel it', 'After 3-6 months', 'After a year', 'Actions > words'] },
      { question: 'Best way to show affection?', options: ['Surprise gifts', 'Undivided attention', 'Physical closeness', 'Helping with tasks'] },
      { question: 'Morning person or night owl?', options: ['Early bird always', 'Night owl forever', 'Depends on the day', 'Both equally'] },
      { question: 'Most important life goal?', options: ['Career success', 'Family & love', 'Travel & freedom', 'Making a difference'] },
    ];
    return pool.sort(() => Math.random() - 0.5).slice(0, count);
  }

  /**
   * Compute the compatibility score for a finished duel.
   * Returns:
   *   matched_count   – questions where both users picked the same option
   *   total_questions – questions both users actually answered
   *   score           – percentage 0-100
   *   insight         – short qualitative summary (AI-generated when possible)
   */
  private async calculateCompatibility(duelId: string) {
    const { data: answers } = await supabaseAdmin
      .from('duel_answers').select('*, duel_questions(question_text)')
      .eq('duel_id', duelId).order('created_at');

    if (!answers || answers.length === 0) {
      return { score: 0, matched_count: 0, total_questions: 0, insight: 'No answers were recorded for this duel.' };
    }

    const byQ: Record<string, any[]> = {};
    for (const a of answers) {
      (byQ[a.question_id] ||= []).push(a);
    }

    let matched = 0;
    let total = 0;
    for (const qa of Object.values(byQ)) {
      if (qa.length === 2) {
        total++;
        if (qa[0].answer === qa[1].answer) matched++;
      } else if (qa.length === 1) {
        // Practice (self) duel — single answer always "matches" itself
        total++;
        matched++;
      }
    }

    const score = total > 0 ? Math.round((matched / total) * 100) : 0;

    // Default insight reflects the actual ratio
    let insight = total === 0
      ? 'No paired answers — try playing again.'
      : score >= 80 ? `Very strong alignment — you matched on ${matched} of ${total} questions.`
      : score >= 60 ? `Good chemistry — you agreed on ${matched} of ${total} answers.`
      : score >= 40 ? `Some shared ground — ${matched} of ${total} answers matched.`
      : score >= 20 ? `Mostly different perspectives — ${matched} of ${total} matched. Opposites can attract.`
      :               `Very different answers — only ${matched} of ${total} matched. Lots to learn about each other.`;

    try {
      const { claude } = await import('../config/claude');
      const msg = await withTimeout(claude.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 200,
        messages: [{ role: 'user', content: `Two people just finished a compatibility quiz. They matched on ${matched} of ${total} questions (${score}%). Write 2 short, encouraging sentences explaining what their compatibility says about them as a potential couple.` }],
      }), 5000);
      const t = msg.content[0].type === 'text' ? msg.content[0].text : '';
      if (t.length > 10) insight = t;
    } catch {
      /* keep deterministic fallback */
    }

    return { score, matched_count: matched, total_questions: total, insight };
  }

  private async updateDuelStats(duel: any) {
    const winnerId = duel.user1_score >= duel.user2_score ? duel.user1_id : duel.user2_id;
    for (const uid of [duel.user1_id, duel.user2_id]) {
      const { data: cr } = await supabaseAdmin.from('duel_credits').select('*').eq('user_id', uid).single();
      if (cr) {
        await supabaseAdmin.from('duel_credits').update({
          total_duels_played: cr.total_duels_played + 1,
          total_wins: uid === winnerId ? cr.total_wins + 1 : cr.total_wins,
        }).eq('user_id', uid);
      }
    }
  }

  private async getSuggestedVenues(u1: string, u2: string) {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, city').in('user_id', [u1, u2]);
    if (!profiles?.length) return [];
    const city = profiles[0]?.city;
    if (!city) return [];
    const { data: venues } = await supabaseAdmin.from('venues').select('id, name, category, city, address, cover_image_url')
      .eq('status', 'approved').eq('city', city).limit(3);
    return venues || [];
  }
}

export const duelService = new DuelService();
