import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createCheckout, getPaymentHistory, getSubscription } from '../controllers/payment.controller';

export const paymentRoutes = Router();

paymentRoutes.use(requireAuth);

paymentRoutes.post('/checkout', createCheckout);
paymentRoutes.get('/history', getPaymentHistory);
paymentRoutes.get('/subscription', getSubscription);
