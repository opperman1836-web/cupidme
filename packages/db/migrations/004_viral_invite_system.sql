-- ============================================================
-- CupidMe.org — Viral Invite & Growth System Schema
-- ============================================================

-- ── Custom Types ──

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

-- ── Tables ──

-- Invite links for viral sharing
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invitee_email TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  duel_id UUID REFERENCES duels(id) ON DELETE SET NULL,
  status invite_status NOT NULL DEFAULT 'pending',
  inviter_display_name TEXT,
  duel_type TEXT,
  compatibility_score NUMERIC(5,2),
  inviter_score INTEGER,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  click_count INTEGER NOT NULL DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Viral metrics per user
CREATE TABLE viral_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  invites_sent INTEGER NOT NULL DEFAULT 0,
  invites_accepted INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  duel_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  chain_depth INTEGER NOT NULL DEFAULT 0,
  referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──

CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_invites_code ON invites(invite_code);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_duel ON invites(duel_id);
CREATE INDEX idx_viral_metrics_user ON viral_metrics(user_id);

-- ── Row Level Security ──

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_metrics ENABLE ROW LEVEL SECURITY;

-- Inviter can see their own invites
CREATE POLICY invites_select ON invites FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users see their own metrics
CREATE POLICY viral_metrics_select ON viral_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- ── Triggers ──

CREATE TRIGGER update_viral_metrics_updated_at
  BEFORE UPDATE ON viral_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
