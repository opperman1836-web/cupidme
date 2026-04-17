import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { logger } from '../utils/logger';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const profile = await userService.getProfile(userId);
    logger.info('[Profile] Fetched', {
      userId,
      found: !!profile,
      profileComplete: profile?.profile_complete ?? null,
    });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

/**
 * POST /api/users/profile — Upsert (create or update) a profile.
 * Safe to call multiple times — uses UPSERT on user_id.
 * Automatically computes profile_complete from required fields.
 */
export async function createProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    logger.info('[Profile] Upsert requested', { userId: req.userId });
    const profile = await userService.upsertProfile(req.userId!, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    logger.error('[Profile] Upsert failed', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

/**
 * PATCH /api/users/profile — Partial update of an existing profile.
 * Validated by updateProfileSchema (partial of createProfileSchema).
 * Automatically re-computes profile_complete after update.
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    logger.info('[Profile] Partial update requested', { userId: req.userId, fields: Object.keys(req.body) });
    const profile = await userService.updateProfile(req.userId!, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    logger.error('[Profile] Update failed', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

export async function addPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { url, position } = req.body;
    logger.info('[Upload] Photo URL received', {
      userId: req.userId,
      url,
      position,
      tokenPresent: !!req.accessToken,
    });
    const photo = await userService.addPhoto(req.userId!, url, position);
    logger.info('[Upload] Photo saved successfully', { userId: req.userId, photoId: photo?.id });
    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    logger.error('[Upload] Photo save failed', { userId: req.userId, error: (err as Error).message });
    next(err);
  }
}

export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await userService.deletePhoto(req.userId!, req.params.photoId as string);
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) { next(err); }
}

export async function setInterests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const interests = await userService.setInterests(req.userId!, req.body.interests);
    res.json({ success: true, data: interests });
  } catch (err) { next(err); }
}

export async function discover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const profiles = await userService.getDiscoverFeed(req.userId!, page, limit);
    res.json({ success: true, data: profiles });
  } catch (err) { next(err); }
}

export async function submitVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userService.submitVerification(req.userId!, req.body.selfie_url);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
