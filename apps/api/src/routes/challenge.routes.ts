import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getChallenges, submitChallenge } from '../controllers/challenge.controller';

export const challengeRoutes = Router();

challengeRoutes.use(requireAuth);

challengeRoutes.get('/', getChallenges);
challengeRoutes.post('/:challengeId/submit', submitChallenge);
