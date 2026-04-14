export type ChallengeCategory =
  | 'icebreaker'
  | 'values'
  | 'compatibility'
  | 'fun'
  | 'deep';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus = 'pending' | 'submitted' | 'passed' | 'failed';

export interface ChallengeTemplate {
  id: string;
  category: ChallengeCategory;
  question_text: string;
  evaluation_criteria: {
    type: 'open_ended' | 'multiple_choice';
    min_word_count?: number;
    keywords_positive?: string[];
    ai_evaluation: boolean;
    pass_threshold: number;
  };
  difficulty: ChallengeDifficulty;
  is_active: boolean;
  created_at: string;
}

export interface ChallengeInstance {
  id: string;
  match_id: string;
  template_id: string;
  assigned_to_user_id: string;
  response_text: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  status: ChallengeStatus;
  submitted_at: string | null;
  evaluated_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface ChallengeSubmitInput {
  challenge_id: string;
  response_text: string;
}

export interface ChallengeWithTemplate extends ChallengeInstance {
  template: ChallengeTemplate;
}
