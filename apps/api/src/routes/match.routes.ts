const Router = require('express').Router;
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { expressInterestSchema } from '../validators/match.validator';
import { expressInterest, getMatches, getMatch, unmatch } from '../controllers/match.controller';

export const matchRoutes = Router();

matchRoutes.use(requireAuth);

matchRoutes.post('/interest', validate(expressInterestSchema), expressInterest);
matchRoutes.get('/', getMatches);
matchRoutes.get('/:matchId', getMatch);
matchRoutes.post('/:matchId/unmatch', unmatch);
