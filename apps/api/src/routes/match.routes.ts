import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { expressInterest, getMatches, getMatch, unmatch } from '../controllers/match.controller';

export const matchRoutes = Router();

matchRoutes.use(requireAuth);

matchRoutes.post('/interest', expressInterest);
matchRoutes.get('/', getMatches);
matchRoutes.get('/:matchId', getMatch);
matchRoutes.post('/:matchId/unmatch', unmatch);
