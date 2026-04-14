import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notifications = await notificationService.getUnread(req.userId!);
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await notificationService.markRead(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllRead(req.userId!);
    res.json({ success: true });
  } catch (err) { next(err); }
}
