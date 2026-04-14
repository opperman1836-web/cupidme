export type MatchStatus =
  | 'pending_challenge'
  | 'challenge_active'
  | 'unlocked'
  | 'expired'
  | 'unmatched';

export interface Interest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  challenge_unlocked_at: string | null;
  chat_started_at: string | null;
  chat_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchWithProfile extends Match {
  other_user: {
    id: string;
    display_name: string;
    bio: string | null;
    primary_photo_url: string | null;
    age: number;
    city: string;
  };
  relationship_score: RelationshipScore | null;
}

export interface RelationshipScore {
  id: string;
  match_id: string;
  connection_level: number;
  trust_score: number;
  chemistry_score: number;
  depth_score: number;
  overall_score: number;
  interaction_count: number;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RelationshipEventType =
  | 'challenge_passed'
  | 'message_sent'
  | 'chat_extended'
  | 'venue_date'
  | 'photo_shared'
  | 'deep_question';

export interface RelationshipEvent {
  id: string;
  match_id: string;
  event_type: RelationshipEventType;
  score_deltas: {
    trust?: number;
    chemistry?: number;
    depth?: number;
    connection_level_up?: boolean;
  };
  created_at: string;
}

export const CONNECTION_LEVELS = [
  { level: 1, name: 'Stranger', min_score: 0, max_score: 10 },
  { level: 2, name: 'Acquaintance', min_score: 10, max_score: 20 },
  { level: 3, name: 'Getting Comfortable', min_score: 20, max_score: 35 },
  { level: 4, name: 'Building Trust', min_score: 35, max_score: 50 },
  { level: 5, name: 'Vibing', min_score: 50, max_score: 60 },
  { level: 6, name: 'Strong Connection', min_score: 60, max_score: 70 },
  { level: 7, name: 'Deep Bond', min_score: 70, max_score: 80 },
  { level: 8, name: 'Soulmate Track', min_score: 80, max_score: 90 },
  { level: 9, name: 'Certified Match', min_score: 90, max_score: 95 },
  { level: 10, name: 'CupidMe Couple', min_score: 95, max_score: 100 },
] as const;
