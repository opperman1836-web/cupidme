const Router = require('express').Router;
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import {
  createDuel, startDuel, answerDuel, completeDuel,
  getDuel, getUserDuels, getCredits, claimFreeCredit, purchaseCredits,
} from '../controllers/duel.controller';
import { createDuelSchema, answerDuelSchema, purchaseCreditsSchema } from '../validators/duel.validator';

export const duelRoutes = Router();

// All duel routes require authentication
duelRoutes.use(requireAuth);

// Specific routes MUST come before parameterized routes
duelRoutes.post('/create', rateLimit(10, 60000), validate(createDuelSchema), createDuel);
duelRoutes.get('/my', getUserDuels);

// Credits — specific path before /:id catch-all
duelRoutes.get('/credits/balance', getCredits);
duelRoutes.post('/credits/claim', rateLimit(2, 60000), claimFreeCredit);
duelRoutes.post('/credits/purchase', rateLimit(5, 60000), validate(purchaseCreditsSchema), purchaseCredits);

// Parameterized routes LAST
duelRoutes.get('/:id', getDuel);
duelRoutes.post('/:id/start', startDuel);
duelRoutes.post('/:id/answer', validate(answerDuelSchema), answerDuel);
duelRoutes.post('/:id/complete', completeDuel);
