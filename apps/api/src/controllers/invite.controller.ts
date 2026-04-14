import { AuthRequest } from '../middleware/auth.middleware';
import { inviteService } from '../services/invite.service';

export async function createInvite(req: AuthRequest, res: any, next: any) {
  try {
    const invite = await inviteService.createInvite(req.userId!, req.body.duel_id);
    res.status(201).json({ success: true, data: invite });
  } catch (err) { next(err); }
}

export async function getInvitePreview(req: any, res: any, next: any) {
  try {
    const preview = await inviteService.getInvitePreview(req.params.code);
    res.json({ success: true, data: preview });
  } catch (err) { next(err); }
}

export async function acceptInvite(req: any, res: any, next: any) {
  try {
    const result = await inviteService.acceptInvite(req.params.code, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function acceptInviteAuth(req: AuthRequest, res: any, next: any) {
  try {
    const result = await inviteService.acceptInviteAuth(req.params.code, req.userId!);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function trackShare(req: AuthRequest, res: any, next: any) {
  try {
    await inviteService.trackShare(req.userId!, req.body.duel_id, req.body.platform);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getViralStats(req: AuthRequest, res: any, next: any) {
  try {
    const stats = await inviteService.getViralStats(req.userId!);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
}
