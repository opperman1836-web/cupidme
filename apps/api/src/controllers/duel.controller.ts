import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { duelService } from '../services/duel.service';

export async function createDuel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const duel = await duelService.createDuel(req.userId!, req.body);
    res.status(201).json({ success: true, data: duel });
  } catch (err) { next(err); }
}

export async function startDuel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await duelService.startDuel(req.params.id, req.userId!);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function answerDuel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await duelService.submitAnswer(req.params.id, req.userId!, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function completeDuel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await duelService.completeDuel(req.params.id, req.userId!);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getDuel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const duel = await duelService.getDuel(req.params.id, req.userId!);
    res.json({ success: true, data: duel });
  } catch (err) { next(err); }
}

export async function getUserDuels(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const duels = await duelService.getUserDuels(req.userId!);
    res.json({ success: true, data: duels });
  } catch (err) { next(err); }
}

export async function getCredits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const credits = await duelService.getCredits(req.userId!);
    res.json({ success: true, data: credits });
  } catch (err) { next(err); }
}

export async function claimFreeCredit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const credits = await duelService.claimFreeCredit(req.userId!);
    res.json({ success: true, data: credits });
  } catch (err) { next(err); }
}

export async function purchaseCredits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await duelService.purchaseCredits(req.userId!, req.body.package);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
