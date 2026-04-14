import { AuthRequest } from '../middleware/auth.middleware';
import { matchService } from '../services/match.service';

export async function expressInterest(req: AuthRequest, res: any, next: any) {
  try {
    const result = await matchService.expressInterest(req.userId!, req.body.to_user_id);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMatches(req: AuthRequest, res: any, next: any) {
  try {
    const matches = await matchService.getMatches(req.userId!);
    res.json({ success: true, data: matches });
  } catch (err) { next(err); }
}

export async function getMatch(req: AuthRequest, res: any, next: any) {
  try {
    const match = await matchService.getMatch(req.params.matchId, req.userId!);
    res.json({ success: true, data: match });
  } catch (err) { next(err); }
}

export async function unmatch(req: AuthRequest, res: any, next: any) {
  try {
    await matchService.unmatch(req.params.matchId, req.userId!);
    res.json({ success: true, message: 'Unmatched' });
  } catch (err) { next(err); }
}
