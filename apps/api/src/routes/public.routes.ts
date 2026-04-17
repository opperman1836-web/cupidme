import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { logger } from '../utils/logger';

export const publicRoutes = Router();

/**
 * GET /api/public/profiles
 *
 * Public endpoint — NO AUTHENTICATION REQUIRED.
 * Returns a small list of complete, active profiles for landing-page preview.
 *
 * Rate limited to prevent scraping. Returns a clean shape:
 *   { user_id, display_name, bio, age, city, photos: [url] }
 */
publicRoutes.get(
  '/profiles',
  rateLimit(60, 60000), // 60 requests/min
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Step 1: fetch 12 complete profiles
      const { data: profileRows, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('user_id, display_name, bio, date_of_birth, city')
        .eq('profile_complete', true)
        .limit(12);

      if (profileErr) {
        logger.error('[Public] Profiles fetch failed', { error: profileErr.message });
        throw profileErr;
      }

      const userIds = (profileRows || []).map((p: any) => p.user_id);
      if (userIds.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }

      // Step 2: fetch photos for those users in a single query
      const { data: photoRows, error: photoErr } = await supabaseAdmin
        .from('user_photos')
        .select('user_id, url, position, is_primary')
        .in('user_id', userIds);

      if (photoErr) {
        logger.error('[Public] Photos fetch failed', { error: photoErr.message });
        // Non-fatal — return profiles without photos
      }

      // Step 3: group photos by user_id
      const photosByUser = new Map<string, string[]>();
      (photoRows || [])
        .sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99))
        .forEach((ph: any) => {
          const list = photosByUser.get(ph.user_id) || [];
          list.push(ph.url);
          photosByUser.set(ph.user_id, list);
        });

      // Step 4: shape final response
      const profiles = (profileRows || []).map((p: any) => {
        const age = p.date_of_birth
          ? Math.floor(
              (Date.now() - new Date(p.date_of_birth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

        return {
          user_id: p.user_id,
          display_name: p.display_name,
          bio: p.bio,
          age,
          city: p.city,
          photos: photosByUser.get(p.user_id) || [],
        };
      });

      // CDN cache — these profiles don't change fast
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.json({ success: true, data: profiles });
    } catch (err) {
      next(err);
    }
  }
);
