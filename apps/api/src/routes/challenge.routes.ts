import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { submitChallengeSchema } from '../validators/challenge.validator';
import { getChallenges, submitChallenge } from '../controllers/challenge.controller';

export const challengeRoutes = Router();

challengeRoutes.use(requireAuth);

challengeRoutes.get('/', getChallenges);
challengeRoutes.post('/:challengeId/submit', validate(submitChallengeSchema), submitChallenge);
