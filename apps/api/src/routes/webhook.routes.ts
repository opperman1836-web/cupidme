import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/payment.controller';

export const webhookRoutes = Router();

// Stripe webhook - raw body handled in server.ts
webhookRoutes.post('/stripe', handleStripeWebhook);
