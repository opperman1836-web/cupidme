import { AuthRequest } from '../middleware/auth.middleware';
import { challengeService } from '../services/challenge.service';

export async function getChallenges(req: AuthRequest, res: any, next: any) {
  try {
    const challenges = await challengeService.getChallenges(req.userId!);
    res.json({ success: true, data: challenges });
  } catch (err) { next(err); }
}

export async function submitChallenge(req: AuthRequest, res: any, next: any) {
  try {
    const result = await challengeService.submitChallenge(
      req.params.challengeId,
      req.userId!,
      req.body.response_text
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
