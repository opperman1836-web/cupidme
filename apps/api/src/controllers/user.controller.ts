import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const profile = await userService.getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function createProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await userService.createProfile(req.userId!, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await userService.updateProfile(req.userId!, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function addPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { url, position } = req.body;
    const photo = await userService.addPhoto(req.userId!, url, position);
    res.status(201).json({ success: true, data: photo });
  } catch (err) { next(err); }
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
