import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { createCheckoutSchema } from '../validators/payment.validator';
import { createCheckout, getPaymentHistory, getSubscription } from '../controllers/payment.controller';

export const paymentRoutes = Router();

paymentRoutes.use(requireAuth);

paymentRoutes.post('/checkout', rateLimit(5, 60000), validate(createCheckoutSchema), createCheckout);
paymentRoutes.get('/history', getPaymentHistory);
paymentRoutes.get('/subscription', getSubscription);
