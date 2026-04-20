import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { logger } from '../utils/logger';
import { toCanonicalProfile, CanonicalProfile } from '../utils/profile-mapper';

export const publicRoutes = Router();

/**
 * GET /api/public/profiles
 * Returns up to 12 complete profiles WITH photos for the landing-page preview.
 * No fake/demo profiles — if the platform has no real users yet, the response
 * is empty and the frontend shows a "be the first" CTA instead of fabricated
 * social proof. Honesty over inflated numbers.
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
        .limit(24); // fetch extra; filter to those with photos below

      if (error) {
        logger.error('[Public] Profiles fetch failed', { error: error.message });
        throw error;
      }

      if (!profileRows || profileRows.length === 0) {
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
        res.json({ success: true, data: [] });
        return;
      }

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

      // Only show profiles that actually have a photo — empty grids beat
      // initialed-letter cards on the public landing page.
      const withPhotos = profiles.filter((p) => p.photos.length > 0).slice(0, 12);

      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.json({ success: true, data: withPhotos });
    } catch (err) {
      next(err);
    }
  }
);
