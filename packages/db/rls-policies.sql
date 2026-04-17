-- ============================================================
-- CupidMe — RLS Policies + Storage Bucket Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. ENABLE RLS ON ALL USER TABLES ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- ── 2. DROP OLD POLICIES (clean slate) ──
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;

DROP POLICY IF EXISTS photos_select ON user_photos;
DROP POLICY IF EXISTS photos_insert_own ON user_photos;
DROP POLICY IF EXISTS photos_update_own ON user_photos;
DROP POLICY IF EXISTS photos_delete_own ON user_photos;

DROP POLICY IF EXISTS interests_select_own ON user_interests;
DROP POLICY IF EXISTS interests_insert_own ON user_interests;
DROP POLICY IF EXISTS interests_delete_own ON user_interests;

-- ── 3. PROFILES POLICIES ──
-- Users can read their own profile OR any complete profile (for discover)
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR profile_complete = true);

-- Users can only insert a profile for themselves
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── 4. USER_PHOTOS POLICIES ──
CREATE POLICY photos_select ON user_photos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY photos_insert_own ON user_photos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY photos_update_own ON user_photos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY photos_delete_own ON user_photos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── 5. USER_INTERESTS POLICIES ──
CREATE POLICY interests_select_own ON user_interests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY interests_insert_own ON user_interests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY interests_delete_own ON user_interests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── 6. CREATE 'photos' STORAGE BUCKET ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── 7. STORAGE POLICIES FOR 'photos' BUCKET ──
-- Path convention: {userId}/{filename}
-- This enforces users can only upload to a folder named after their own user_id
DROP POLICY IF EXISTS "photos_read_all" ON storage.objects;
DROP POLICY IF EXISTS "photos_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "photos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "photos_delete_own" ON storage.objects;

-- Anyone (including anon) can read photos — needed for public profile cards
CREATE POLICY "photos_read_all" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'photos');

-- Authenticated users can only upload to their own folder: {userId}/...
CREATE POLICY "photos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can only update their own photos
CREATE POLICY "photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can only delete their own photos
CREATE POLICY "photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 8. VERIFY ──
SELECT 'RLS + Storage policies applied successfully' AS status;
