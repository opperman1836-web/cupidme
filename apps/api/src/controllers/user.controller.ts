import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { logger } from '../utils/logger';

/**
 * All controllers follow the same pattern:
 *   try { ... } catch { log + forward to errorHandler middleware }
 * The errorHandler translates to the standard
 *   { success: false, message: "..." }  shape.
 */

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const profile = await userService.getProfile(userId);
    logger.info('profile_fetch', {
      userId,
      found: !!profile,
      profileComplete: profile?.profile_complete ?? null,
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    logger.error('profile_fetch', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

/**
 * POST /api/users/profile — Upsert (create or update) a profile.
 * Validated by createProfileSchema at the route level.
 */
export async function createProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    logger.info('profile_upsert', { stage: 'request', userId: req.userId, fields: Object.keys(req.body || {}) });
    const profile = await userService.upsertProfile(req.userId!, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    logger.error('profile_upsert', { stage: 'controller_error', userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

/**
 * PATCH /api/users/profile — Partial update.
 * Validated by updateProfileSchema.
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    logger.info('profile_update', { userId: req.userId, fields: Object.keys(req.body || {}) });
    const profile = await userService.updateProfile(req.userId!, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    logger.error('profile_update', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

/** Legacy single-photo endpoint — kept for backward compat. */
export async function addPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { url, position } = req.body;
    logger.info('photo_add', { userId: req.userId, position });
    const photo = await userService.addPhoto(req.userId!, url, position);
    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    logger.error('photo_add', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await userService.deletePhoto(req.userId!, req.params.photoId as string);
    logger.info('photo_delete', { userId: req.userId, photoId: req.params.photoId });
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) {
    logger.error('photo_delete', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

/**
 * PUT /api/users/photos — Replace-all.
 * Validated by replacePhotosSchema (photos: string[] of URLs, max 10).
 */
export async function replacePhotos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { photos } = req.body as { photos: string[] };
    logger.info('photos_replace', { userId: req.userId, count: photos.length });
    const saved = await userService.replacePhotos(req.userId!, photos);
    res.json({ success: true, data: { photos: saved } });
  } catch (err) {
    logger.error('photos_replace', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

export async function setInterests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    logger.info('interests_set', { userId: req.userId, count: (req.body?.interests || []).length });
    const interests = await userService.setInterests(req.userId!, req.body.interests);
    res.json({ success: true, data: interests });
  } catch (err) {
    logger.error('interests_set', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

export async function discover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const profiles = await userService.getDiscoverFeed(req.userId!, page, limit);
    res.json({ success: true, data: profiles });
  } catch (err) {
    logger.error('discover', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

export async function submitVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userService.submitVerification(req.userId!, req.body.selfie_url);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('verification_submit', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}
