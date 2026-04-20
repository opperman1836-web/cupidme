-- ============================================================
-- CupidMe.org — Duel acceptance flow
--
-- Adds 'accepted' and 'rejected' to duel_status so an opponent must
-- actively accept a challenge before either user can start playing.
--
-- Flow:
--   pending  → A invited B, awaiting B's response
--   accepted → B accepted; either user can /start to generate questions
--   rejected → B declined; terminal state, no scoring
--   active   → questions generated, both can answer
--   completed| expired | cancelled — pre-existing terminal states
--
-- Practice (self-) duels are auto-accepted by the application layer.
-- ============================================================

ALTER TYPE duel_status ADD VALUE IF NOT EXISTS 'accepted'  BEFORE 'active';
ALTER TYPE duel_status ADD VALUE IF NOT EXISTS 'rejected'  AFTER 'completed';

-- Track who accepted (or rejected) and when, so we can show "B accepted 5 min ago"
-- and audit declines for spam-prevention later.
ALTER TABLE duels
  ADD COLUMN IF NOT EXISTS accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT;
