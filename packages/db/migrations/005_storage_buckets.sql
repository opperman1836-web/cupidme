-- ============================================================
-- CupidMe.org — Storage buckets + RLS
-- Idempotent: safe to run on existing Supabase projects.
--
-- This migration is what makes profile photo uploads work end-to-end.
-- Without it, `supabase.storage.from('photos').upload(...)` from the
-- frontend fails with "bucket not found" or RLS-denied errors.
-- ============================================================

-- 1. Create the `photos` bucket (public so the public-profiles preview
--    on the landing page can render <img src> directly without signing).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10 * 1024 * 1024,                    -- 10 MB cap (matches frontend check)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies on storage.objects (storage tables already have RLS enabled
--    by default in Supabase).
--
--    Convention: each user uploads to a folder named after their auth.uid(),
--    e.g. `photos/<user-id>/photo-0-<ts>.jpg`. The frontend already uses this
--    layout in apps/web/src/app/(main)/profile/edit/page.tsx.

-- Drop old policies if rerunning (CREATE POLICY has no IF NOT EXISTS).
DROP POLICY IF EXISTS "photos_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "photos_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "photos_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "photos_owner_delete"  ON storage.objects;

-- Public read — anyone can fetch photo URLs (bucket is public).
CREATE POLICY "photos_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'photos');

-- Authenticated users can INSERT into their own folder only.
CREATE POLICY "photos_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can UPDATE (overwrite) files in their own folder.
CREATE POLICY "photos_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can DELETE files in their own folder.
CREATE POLICY "photos_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
