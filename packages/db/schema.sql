-- ============================================================
-- CupidMe.org — Complete Database Schema
-- Supabase (PostgreSQL) with Row Level Security
-- ============================================================

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Custom Types ──
CREATE TYPE user_role AS ENUM ('user', 'venue_owner', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'other');
CREATE TYPE gender_preference_type AS ENUM ('male', 'female', 'non_binary', 'everyone');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE match_status AS ENUM ('pending_challenge', 'challenge_active', 'unlocked', 'expired', 'unmatched');
CREATE TYPE challenge_category AS ENUM ('icebreaker', 'values', 'compatibility', 'fun', 'deep');
CREATE TYPE challenge_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE challenge_status AS ENUM ('pending', 'submitted', 'passed', 'failed');
CREATE TYPE chat_room_status AS ENUM ('active', 'expired', 'extended', 'closed');
CREATE TYPE message_type AS ENUM ('text', 'image', 'voice_note', 'system');
CREATE TYPE moderation_status AS ENUM ('clean', 'flagged', 'blocked');
CREATE TYPE product_type AS ENUM ('one_time', 'subscription');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE venue_category AS ENUM ('coffee_shop', 'restaurant', 'bar', 'activity', 'experience');
CREATE TYPE venue_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE offer_type AS ENUM ('percentage_discount', 'fixed_discount', 'free_item', 'special_menu');
CREATE TYPE redemption_status AS ENUM ('generated', 'scanned', 'redeemed', 'expired');
CREATE TYPE report_reason AS ENUM ('inappropriate', 'spam', 'harassment', 'fake_profile', 'other');
CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
CREATE TYPE notification_type AS ENUM ('match', 'challenge', 'chat', 'payment', 'venue', 'system');
CREATE TYPE relationship_event_type AS ENUM ('challenge_passed', 'message_sent', 'chat_extended', 'venue_date', 'photo_shared', 'deep_question');

-- ============================================================
-- 1. USERS & PROFILES
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 50),
  bio TEXT CHECK (char_length(bio) <= 500),
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  gender_preference gender_preference_type NOT NULL,
  city TEXT NOT NULL,
  province TEXT,
  country TEXT NOT NULL DEFAULT 'ZA',
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  max_distance_km INTEGER NOT NULL DEFAULT 50,
  age_range_min INTEGER NOT NULL DEFAULT 18 CHECK (age_range_min >= 18),
  age_range_max INTEGER NOT NULL DEFAULT 50 CHECK (age_range_max <= 100),
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (age_range_min <= age_range_max)
);

CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX idx_profiles_gender_pref ON profiles(gender, gender_preference);
CREATE INDEX idx_profiles_city ON profiles(city);

CREATE TABLE user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 6),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, position)
);

CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_tag TEXT NOT NULL,
  category TEXT NOT NULL,
  UNIQUE(user_id, interest_tag)
);

CREATE TABLE user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  selfie_url TEXT,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. MATCHING SYSTEM
-- ============================================================

CREATE TABLE expressed_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id),
  CHECK(from_user_id != to_user_id)
);

CREATE INDEX idx_interests_pair ON expressed_interests(from_user_id, to_user_id);
CREATE INDEX idx_interests_reverse ON expressed_interests(to_user_id, from_user_id);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'pending_challenge',
  challenge_unlocked_at TIMESTAMPTZ,
  chat_started_at TIMESTAMPTZ,
  chat_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(user_a_id < user_b_id),
  UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX idx_matches_user_a ON matches(user_a_id);
CREATE INDEX idx_matches_user_b ON matches(user_b_id);
CREATE INDEX idx_matches_status ON matches(status);

-- ── Trigger: Auto-create match on mutual interest ──
CREATE OR REPLACE FUNCTION create_match_on_mutual_interest()
RETURNS TRIGGER AS $$
DECLARE
  v_user_a UUID;
  v_user_b UUID;
BEGIN
  -- Check if reverse interest exists
  IF EXISTS (
    SELECT 1 FROM expressed_interests
    WHERE from_user_id = NEW.to_user_id
      AND to_user_id = NEW.from_user_id
  ) THEN
    -- Ensure user_a_id < user_b_id
    IF NEW.from_user_id < NEW.to_user_id THEN
      v_user_a := NEW.from_user_id;
      v_user_b := NEW.to_user_id;
    ELSE
      v_user_a := NEW.to_user_id;
      v_user_b := NEW.from_user_id;
    END IF;

    -- Create match if not exists
    INSERT INTO matches (user_a_id, user_b_id, status)
    VALUES (v_user_a, v_user_b, 'pending_challenge')
    ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mutual_interest
  AFTER INSERT ON expressed_interests
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_interest();

-- ============================================================
-- 3. CHALLENGE ENGINE
-- ============================================================

CREATE TABLE challenge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category challenge_category NOT NULL,
  question_text TEXT NOT NULL,
  evaluation_criteria JSONB NOT NULL,
  difficulty challenge_difficulty NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE challenge_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES challenge_templates(id),
  assigned_to_user_id UUID NOT NULL REFERENCES users(id),
  response_text TEXT,
  ai_score DECIMAL(3,2) CHECK (ai_score >= 0 AND ai_score <= 1),
  ai_feedback TEXT,
  status challenge_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  evaluated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_match ON challenge_instances(match_id);
CREATE INDEX idx_challenges_user ON challenge_instances(assigned_to_user_id);

-- ============================================================
-- 4. RELATIONSHIP ENGINE
-- ============================================================

CREATE TABLE relationship_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  connection_level INTEGER NOT NULL DEFAULT 1 CHECK (connection_level BETWEEN 1 AND 10),
  trust_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  chemistry_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (chemistry_score >= 0 AND chemistry_score <= 100),
  depth_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 100),
  overall_score DECIMAL(5,2) GENERATED ALWAYS AS (
    trust_score * 0.3 + chemistry_score * 0.3 + depth_score * 0.4
  ) STORED,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE relationship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_type relationship_event_type NOT NULL,
  score_deltas JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rel_events_match ON relationship_events(match_id);

-- ── Trigger: Auto-create relationship_scores when match is created ──
CREATE OR REPLACE FUNCTION create_relationship_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO relationship_scores (match_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_relationship_score
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION create_relationship_score();

-- ── Function: Update connection level based on overall score ──
CREATE OR REPLACE FUNCTION update_connection_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.connection_level := CASE
    WHEN NEW.overall_score >= 95 THEN 10
    WHEN NEW.overall_score >= 90 THEN 9
    WHEN NEW.overall_score >= 80 THEN 8
    WHEN NEW.overall_score >= 70 THEN 7
    WHEN NEW.overall_score >= 60 THEN 6
    WHEN NEW.overall_score >= 50 THEN 5
    WHEN NEW.overall_score >= 35 THEN 4
    WHEN NEW.overall_score >= 20 THEN 3
    WHEN NEW.overall_score >= 10 THEN 2
    ELSE 1
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_connection_level
  BEFORE UPDATE ON relationship_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_level();

-- ============================================================
-- 5. CHAT SYSTEM
-- ============================================================

CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  status chat_room_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  extended_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  message_type message_type NOT NULL DEFAULT 'text',
  is_read BOOLEAN NOT NULL DEFAULT false,
  moderation_status moderation_status NOT NULL DEFAULT 'clean',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_room_time ON messages(chat_room_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================================
-- 6. PAYMENT SYSTEM
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type product_type NOT NULL,
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,
  amount_zar INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  match_id UUID REFERENCES matches(id),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  amount_zar INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'zar',
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status subscription_status NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- ============================================================
-- 7. VENUE SYSTEM
-- ============================================================

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  category venue_category NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  status venue_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_venues_location ON venues(latitude, longitude);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_status ON venues(status);

CREATE TABLE venue_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  offer_type offer_type NOT NULL,
  discount_value DECIMAL(5,2),
  min_connection_level INTEGER NOT NULL DEFAULT 6,
  max_redemptions INTEGER,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_from < valid_until)
);

CREATE INDEX idx_offers_venue_active ON venue_offers(venue_id) WHERE is_active = true;

CREATE TABLE offer_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES venue_offers(id),
  match_id UUID NOT NULL REFERENCES matches(id),
  redeemed_by_user_id UUID NOT NULL REFERENCES users(id),
  qr_code TEXT UNIQUE NOT NULL,
  status redemption_status NOT NULL DEFAULT 'generated',
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE venue_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status subscription_status NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id) WHERE is_read = false;

-- ============================================================
-- 9. REPORTS & ADMIN
-- ============================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_user_id UUID NOT NULL REFERENCES users(id),
  match_id UUID REFERENCES matches(id),
  reason report_reason NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES users(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status);

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expressed_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: read own data
CREATE POLICY users_select_own ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid());

-- Profiles: read own + discoverable profiles, update own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  user_id = auth.uid() OR profile_complete = true
);
CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Photos: read own + discoverable, manage own
CREATE POLICY photos_select ON user_photos FOR SELECT USING (true);
CREATE POLICY photos_insert_own ON user_photos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY photos_update_own ON user_photos FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY photos_delete_own ON user_photos FOR DELETE USING (user_id = auth.uid());

-- Interests (expressed): manage own
CREATE POLICY interests_select_own ON expressed_interests FOR SELECT USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);
CREATE POLICY interests_insert_own ON expressed_interests FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Matches: see own matches
CREATE POLICY matches_select_own ON matches FOR SELECT USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- Challenges: see assigned challenges
CREATE POLICY challenges_select_own ON challenge_instances FOR SELECT USING (
  assigned_to_user_id = auth.uid()
);
CREATE POLICY challenges_update_own ON challenge_instances FOR UPDATE USING (
  assigned_to_user_id = auth.uid()
);

-- Chat rooms: see own rooms
CREATE POLICY chatrooms_select_own ON chat_rooms FOR SELECT USING (
  match_id IN (SELECT id FROM matches WHERE user_a_id = auth.uid() OR user_b_id = auth.uid())
);

-- Messages: see messages in own chat rooms
CREATE POLICY messages_select_own ON messages FOR SELECT USING (
  chat_room_id IN (
    SELECT cr.id FROM chat_rooms cr
    JOIN matches m ON m.id = cr.match_id
    WHERE m.user_a_id = auth.uid() OR m.user_b_id = auth.uid()
  )
);
CREATE POLICY messages_insert_own ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Payments: see own
CREATE POLICY payments_select_own ON payments FOR SELECT USING (user_id = auth.uid());

-- Subscriptions: see own
CREATE POLICY subs_select_own ON subscriptions FOR SELECT USING (user_id = auth.uid());

-- Venues: see approved or own
CREATE POLICY venues_select ON venues FOR SELECT USING (
  status = 'approved' OR owner_id = auth.uid()
);
CREATE POLICY venues_insert_own ON venues FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY venues_update_own ON venues FOR UPDATE USING (owner_id = auth.uid());

-- Venue offers: see active offers for approved venues
CREATE POLICY offers_select ON venue_offers FOR SELECT USING (
  is_active = true OR venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Notifications: see own
CREATE POLICY notif_select_own ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notif_update_own ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- 11. SEED DATA: Challenge Templates
-- ============================================================

INSERT INTO challenge_templates (category, question_text, evaluation_criteria, difficulty) VALUES
('icebreaker', 'What is one thing that always makes you smile, no matter how bad your day has been?', '{"type": "open_ended", "min_word_count": 15, "ai_evaluation": true, "pass_threshold": 0.5}', 'easy'),
('icebreaker', 'If you could have dinner with anyone, living or dead, who would it be and what would you ask them?', '{"type": "open_ended", "min_word_count": 20, "ai_evaluation": true, "pass_threshold": 0.5}', 'easy'),
('values', 'What does trust mean to you in a relationship, and how do you build it?', '{"type": "open_ended", "min_word_count": 25, "ai_evaluation": true, "pass_threshold": 0.6}', 'medium'),
('values', 'Describe a moment when you had to choose between being right and being kind. What did you do?', '{"type": "open_ended", "min_word_count": 25, "ai_evaluation": true, "pass_threshold": 0.6}', 'medium'),
('compatibility', 'How do you handle disagreements with someone you care about? Give a real example.', '{"type": "open_ended", "min_word_count": 30, "ai_evaluation": true, "pass_threshold": 0.6}', 'medium'),
('compatibility', 'What does your ideal weekend look like? Be specific about activities, timing, and energy.', '{"type": "open_ended", "min_word_count": 20, "ai_evaluation": true, "pass_threshold": 0.5}', 'easy'),
('fun', 'You are stranded on a desert island with your match. You can bring 3 items. What are they and why?', '{"type": "open_ended", "min_word_count": 20, "ai_evaluation": true, "pass_threshold": 0.4}', 'easy'),
('fun', 'Create a 4-line poem about what makes you a great partner. Bonus points for humor!', '{"type": "open_ended", "min_word_count": 10, "ai_evaluation": true, "pass_threshold": 0.4}', 'easy'),
('deep', 'What is your biggest fear about falling in love, and how do you work through it?', '{"type": "open_ended", "min_word_count": 30, "ai_evaluation": true, "pass_threshold": 0.7}', 'hard'),
('deep', 'Describe the most important lesson a past relationship (any kind) taught you about yourself.', '{"type": "open_ended", "min_word_count": 30, "ai_evaluation": true, "pass_threshold": 0.7}', 'hard');

-- ============================================================
-- 12. SEED DATA: Products
-- ============================================================

INSERT INTO products (name, type, amount_zar, description) VALUES
('Match Unlock', 'one_time', 2900, 'Unlock a match to start the challenge'),
('Chat Extension (24h)', 'one_time', 1900, 'Extend your chat by 24 hours'),
('CupidMe Plus', 'subscription', 14900, 'Monthly subscription: 5 free unlocks, priority matching'),
('CupidMe Premium', 'subscription', 29900, 'Monthly subscription: unlimited unlocks, all features'),
('Venue Basic', 'subscription', 49900, 'Venue monthly: list offers, basic analytics'),
('Venue Pro', 'subscription', 99900, 'Venue monthly: featured placement, full analytics, priority support');

-- ============================================================
-- 13. RPC Functions
-- ============================================================

CREATE OR REPLACE FUNCTION increment_redemption_count(p_offer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE venue_offers
  SET current_redemptions = current_redemptions + 1
  WHERE id = p_offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. Updated_at trigger helper
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_venue_subs_updated_at BEFORE UPDATE ON venue_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
