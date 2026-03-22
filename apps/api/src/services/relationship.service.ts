import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';

const EVENT_SCORE_DELTAS: Record<string, { trust: number; chemistry: number; depth: number }> = {
  challenge_passed: { trust: 10, chemistry: 5, depth: 8 },
  message_sent: { trust: 0.5, chemistry: 1, depth: 0.3 },
  chat_extended: { trust: 3, chemistry: 5, depth: 2 },
  venue_date: { trust: 8, chemistry: 10, depth: 7 },
  photo_shared: { trust: 2, chemistry: 3, depth: 1 },
  deep_question: { trust: 3, chemistry: 2, depth: 8 },
};

export class RelationshipService {
  async getScore(matchId: string) {
    const { data, error } = await supabaseAdmin
      .from('relationship_scores')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async recordEvent(matchId: string, eventType: string) {
    const deltas = EVENT_SCORE_DELTAS[eventType];
    if (!deltas) throw new AppError(`Unknown event type: ${eventType}`);

    // Get current scores
    const { data: current } = await supabaseAdmin
      .from('relationship_scores')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (!current) throw new AppError('No relationship score found for match');

    // Apply deltas with clamping at 100
    const newTrust = Math.min(100, current.trust_score + deltas.trust);
    const newChemistry = Math.min(100, current.chemistry_score + deltas.chemistry);
    const newDepth = Math.min(100, current.depth_score + deltas.depth);

    await supabaseAdmin
      .from('relationship_scores')
      .update({
        trust_score: newTrust,
        chemistry_score: newChemistry,
        depth_score: newDepth,
        interaction_count: current.interaction_count + 1,
        last_interaction_at: new Date().toISOString(),
      })
      .eq('match_id', matchId);

    // Log event
    await supabaseAdmin
      .from('relationship_events')
      .insert({
        match_id: matchId,
        event_type: eventType,
        score_deltas: deltas,
      });

    return { trust: newTrust, chemistry: newChemistry, depth: newDepth };
  }

  async getEvents(matchId: string) {
    const { data, error } = await supabaseAdmin
      .from('relationship_events')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message);
    return data || [];
  }
}

export const relationshipService = new RelationshipService();
