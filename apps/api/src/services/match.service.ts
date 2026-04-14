import { supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { challengeService } from './challenge.service';

export class MatchService {
  async expressInterest(fromUserId: string, toUserId: string) {
    const { data, error } = await supabaseAdmin
      .from('expressed_interests')
      .insert({ from_user_id: fromUserId, to_user_id: toUserId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new AppError('Interest already expressed');
      throw new AppError(error.message);
    }

    // Check if a match was auto-created by the trigger
    const userA = fromUserId < toUserId ? fromUserId : toUserId;
    const userB = fromUserId < toUserId ? toUserId : fromUserId;

    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('user_a_id', userA)
      .eq('user_b_id', userB)
      .single();

    if (match) {
      // Mutual interest — assign challenges
      await challengeService.assignChallenges(match.id, userA, userB);
      return { mutual: true, match_id: match.id };
    }

    return { mutual: false, match_id: null };
  }

  async getMatches(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        relationship_scores(*),
        challenge_instances(*)
      `)
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .neq('status', 'unmatched')
      .order('updated_at', { ascending: false });

    if (error) throw new AppError(error.message);

    // Enrich with other user's profile, last message, and unread status
    const enriched = await Promise.all(
      (data || []).map(async (match) => {
        const otherUserId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('display_name, bio, city, date_of_birth')
          .eq('user_id', otherUserId)
          .single();

        const { data: photo } = await supabaseAdmin
          .from('user_photos')
          .select('url')
          .eq('user_id', otherUserId)
          .eq('is_primary', true)
          .single();

        // Get last message and unread count for unlocked matches
        let lastMessage: string | null = null;
        let hasUnread = false;

        if (match.status === 'unlocked') {
          const { data: chatRoom } = await supabaseAdmin
            .from('chat_rooms')
            .select('id')
            .eq('match_id', match.id)
            .single();

          if (chatRoom) {
            const { data: lastMsg } = await supabaseAdmin
              .from('messages')
              .select('content, sender_id')
              .eq('chat_room_id', chatRoom.id)
              .neq('moderation_status', 'blocked')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastMsg) {
              lastMessage = lastMsg.sender_id === userId
                ? `You: ${lastMsg.content}`
                : lastMsg.content;
              if (lastMessage.length > 60) lastMessage = lastMessage.slice(0, 57) + '...';
            }

            const { count } = await supabaseAdmin
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('chat_room_id', chatRoom.id)
              .neq('sender_id', userId)
              .eq('is_read', false);

            hasUnread = (count || 0) > 0;
          }
        }

        return {
          ...match,
          last_message: lastMessage,
          has_unread: hasUnread,
          other_user: {
            id: otherUserId,
            display_name: profile?.display_name,
            bio: profile?.bio,
            city: profile?.city,
            primary_photo_url: photo?.url || null,
          },
        };
      })
    );

    return enriched;
  }

  async getMatch(matchId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select('*, relationship_scores(*), challenge_instances(*)')
      .eq('id', matchId)
      .single();

    if (error || !data) throw new NotFoundError('Match');
    if (data.user_a_id !== userId && data.user_b_id !== userId) {
      throw new AppError('Not your match', 403);
    }

    return data;
  }

  async unmatch(matchId: string, userId: string) {
    const match = await this.getMatch(matchId, userId);

    const { error } = await supabaseAdmin
      .from('matches')
      .update({ status: 'unmatched', updated_at: new Date().toISOString() })
      .eq('id', match.id);

    if (error) throw new AppError(error.message);
  }
}

export const matchService = new MatchService();
