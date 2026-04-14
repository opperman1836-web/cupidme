-- ============================================================
-- CupidMe.org — Cupid Duel System Schema
-- ============================================================

-- ── Custom Types ──

CREATE TYPE duel_status AS ENUM ('pending', 'active', 'completed', 'expired', 'cancelled');
CREATE TYPE duel_type AS ENUM ('compatibility', 'icebreaker', 'deep_connection', 'fun', 'rapid_fire');

-- ── Tables ──

-- Main duels table
CREATE TABLE duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  status duel_status NOT NULL DEFAULT 'pending',
  type duel_type NOT NULL DEFAULT 'compatibility',
  user1_score INTEGER NOT NULL DEFAULT 0,
  user2_score INTEGER NOT NULL DEFAULT 0,
  user1_completed BOOLEAN NOT NULL DEFAULT false,
  user2_completed BOOLEAN NOT NULL DEFAULT false,
  total_questions INTEGER NOT NULL DEFAULT 5,
  current_question INTEGER NOT NULL DEFAULT 0,
  compatibility_score NUMERIC(5,2),
  ai_insight TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user1_id <> user2_id)
);

-- Duel questions — AI-generated per duel
CREATE TABLE duel_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  time_limit_seconds INTEGER NOT NULL DEFAULT 15,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(duel_id, question_number)
);

-- User answers per question
CREATE TABLE duel_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES duel_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  answered_in_seconds NUMERIC(5,2),
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Credits system
CREATE TABLE duel_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  credits INTEGER NOT NULL DEFAULT 1,
  total_duels_played INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  last_free_claim TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──

CREATE INDEX idx_duels_user1 ON duels(user1_id);
CREATE INDEX idx_duels_user2 ON duels(user2_id);
CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_match ON duels(match_id);
CREATE INDEX idx_duel_questions_duel ON duel_questions(duel_id);
CREATE INDEX idx_duel_answers_duel ON duel_answers(duel_id);
CREATE INDEX idx_duel_answers_user ON duel_answers(user_id);
CREATE INDEX idx_duel_credits_user ON duel_credits(user_id);

-- ── Row Level Security ──

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_credits ENABLE ROW LEVEL SECURITY;

-- Users can see duels they participate in
CREATE POLICY duels_select ON duels FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can see questions for their duels
CREATE POLICY duel_questions_select ON duel_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM duels
      WHERE duels.id = duel_questions.duel_id
      AND (duels.user1_id = auth.uid() OR duels.user2_id = auth.uid())
    )
  );

-- Users can see their own answers
CREATE POLICY duel_answers_select ON duel_answers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can see their own credits
CREATE POLICY duel_credits_select ON duel_credits FOR SELECT
  USING (auth.uid() = user_id);

-- ── Triggers ──

-- Auto-update updated_at
CREATE TRIGGER update_duels_updated_at
  BEFORE UPDATE ON duels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_duel_credits_updated_at
  BEFORE UPDATE ON duel_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed: Add duel credit product ──
INSERT INTO products (name, description, type, amount_zar, stripe_price_id, is_active)
VALUES
  ('5 Duel Credits', 'Five duel credits to challenge your matches', 'one_time', 4900, NULL, true),
  ('20 Duel Credits', 'Twenty duel credits — best value', 'one_time', 14900, NULL, true)
ON CONFLICT DO NOTHING;
