import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { logger } from '../utils/logger';
import { toCanonicalProfile, CanonicalProfile } from '../utils/profile-mapper';

export const publicRoutes = Router();

/**
 * In-code fallback profiles — used ONLY if the DB has zero complete profiles.
 * Guarantees the landing page never looks empty.
 */
const FALLBACK_PROFILES: CanonicalProfile[] = [
  { user_id: 'demo-1', display_name: 'Amara', bio: 'Coffee addict, weekend hiker.',
    age: 28, date_of_birth: null, city: 'Cape Town', country: 'ZA', gender: 'female', gender_preference: 'everyone',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80'],
    interests: ['☕ Coffee', '🏖️ Beach'], profile_complete: true, is_verified: true },
  { user_id: 'demo-2', display_name: 'Thabo', bio: 'Engineer. Jazz vinyl collector.',
    age: 30, date_of_birth: null, city: 'Johannesburg', country: 'ZA', gender: 'male', gender_preference: 'female',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
    interests: ['🎵 Music', '📱 Tech'], profile_complete: true, is_verified: true },
  { user_id: 'demo-3', display_name: 'Priya', bio: 'Yoga instructor & travel addict.',
    age: 29, date_of_birth: null, city: 'Durban', country: 'ZA', gender: 'female', gender_preference: 'everyone',
    photos: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80'],
    interests: ['🧘 Yoga', '✈️ Travel'], profile_complete: true, is_verified: true },
  { user_id: 'demo-4', display_name: 'Lerato', bio: 'Architect. Wine lover. Botanical gardens.',
    age: 31, date_of_birth: null, city: 'Pretoria', country: 'ZA', gender: 'female', gender_preference: 'male',
    photos: ['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80'],
    interests: ['🍷 Wine', '🌱 Nature'], profile_complete: true, is_verified: true },
  { user_id: 'demo-5', display_name: 'James', bio: 'Surfer. Photographer. Looking for sunsets.',
    age: 32, date_of_birth: null, city: 'Cape Town', country: 'ZA', gender: 'male', gender_preference: 'female',
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80'],
    interests: ['📸 Photography', '🏖️ Beach'], profile_complete: true, is_verified: true },
  { user_id: 'demo-6', display_name: 'Zara', bio: 'Marketing by day, novelist by night.',
    age: 28, date_of_birth: null, city: 'Johannesburg', country: 'ZA', gender: 'female', gender_preference: 'everyone',
    photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'],
    interests: ['📚 Reading', '☕ Coffee'], profile_complete: true, is_verified: true },
];

/**
 * GET /api/public/profiles
 * Returns 12 complete profiles for the public landing page.
 * NO authentication. NO user filtering. Always returns data (fallback demo if DB empty).
 */
publicRoutes.get(
  '/profiles',
  rateLimit(60, 60000),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: profileRows, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('profile_complete', true)
        .limit(12);

      if (error) {
        logger.error('[Public] Profiles fetch failed', { error: error.message });
        throw error;
      }

      // Fallback to demo profiles if DB has none
      if (!profileRows || profileRows.length === 0) {
        logger.info('[Public] No profiles in DB, returning fallback demos');
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
        res.json({ success: true, data: FALLBACK_PROFILES, fallback: true });
        return;
      }

      // Fetch photos + interests for the selected users in one shot each
      const userIds = profileRows.map((p: any) => p.user_id);
      const [photosRes, interestsRes] = await Promise.all([
        supabaseAdmin.from('user_photos').select('user_id, url, position').in('user_id', userIds),
        supabaseAdmin.from('user_interests').select('user_id, interest_tag').in('user_id', userIds),
      ]);

      const photosByUser = new Map<string, any[]>();
      (photosRes.data || []).forEach((ph: any) => {
        const list = photosByUser.get(ph.user_id) || [];
        list.push(ph);
        photosByUser.set(ph.user_id, list);
      });

      const interestsByUser = new Map<string, any[]>();
      (interestsRes.data || []).forEach((i: any) => {
        const list = interestsByUser.get(i.user_id) || [];
        list.push(i);
        interestsByUser.set(i.user_id, list);
      });

      const profiles: CanonicalProfile[] = profileRows.map((p: any) =>
        toCanonicalProfile(p, {
          photos: photosByUser.get(p.user_id) || [],
          interests: interestsByUser.get(p.user_id) || [],
        })
      );

      // If we got rows but they all have zero photos, blend in fallback to keep landing alive
      const withPhotos = profiles.filter((p) => p.photos.length > 0);
      const final = withPhotos.length > 0 ? profiles : FALLBACK_PROFILES;

      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.json({ success: true, data: final });
    } catch (err) {
      next(err);
    }
  }
);
