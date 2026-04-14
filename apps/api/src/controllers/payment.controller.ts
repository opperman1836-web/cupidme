import { AuthRequest } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';
import { stripe } from '../config/stripe';
import { env } from '../config/env';

export async function createCheckout(req: AuthRequest, res: any, next: any) {
  try {
    const { product_id, match_id } = req.body;
    const result = await paymentService.createCheckoutSession(req.userId!, product_id, match_id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getPaymentHistory(req: AuthRequest, res: any, next: any) {
  try {
    const history = await paymentService.getPaymentHistory(req.userId!);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
}

export async function getSubscription(req: AuthRequest, res: any, next: any) {
  try {
    const sub = await paymentService.getSubscription(req.userId!);
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
}

export async function handleStripeWebhook(req: any, res: any, _next: any) {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
}
