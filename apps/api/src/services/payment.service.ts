import { stripe } from '../config/stripe';
import { supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class PaymentService {
  async createCheckoutSession(userId: string, productId: string, matchId?: string) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (!product) throw new NotFoundError('Product');

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    if (product.type === 'subscription') {
      if (!product.stripe_price_id) throw new AppError('Product not configured in Stripe');

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: product.stripe_price_id, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/payments/cancel`,
        metadata: { user_id: userId, product_id: productId },
      });

      return { session_id: session.id, url: session.url };
    }

    // One-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'zar',
            product_data: { name: product.name },
            unit_amount: product.amount_zar,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/payments/cancel`,
      metadata: {
        user_id: userId,
        product_id: productId,
        match_id: matchId || '',
      },
    });

    // Record pending payment
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      product_id: productId,
      match_id: matchId || null,
      stripe_checkout_session_id: session.id,
      amount_zar: product.amount_zar,
      status: 'pending',
    });

    return { session_id: session.id, url: session.url };
  }

  async handleWebhook(event: any) {
    // Idempotency: check if this Stripe event was already processed
    const { data: processed } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (processed) {
      logger.info(`Webhook event ${event.id} already processed, skipping`);
      return;
    }

    // Record the event BEFORE processing to prevent race conditions
    await supabaseAdmin.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    }).catch(() => {
      // If insert fails due to unique constraint, another process is handling it
      logger.warn(`Webhook event ${event.id} insert conflict, skipping`);
      return;
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        await supabaseAdmin
          .from('payments')
          .update({ status: 'succeeded', stripe_payment_intent_id: intent.id })
          .eq('stripe_checkout_session_id', intent.metadata?.session_id);
        break;
      }
    }
  }

  private async handleCheckoutComplete(session: any) {
    const { user_id, product_id, match_id, type, credits } = session.metadata || {};

    // Handle duel credit purchases
    if (type === 'duel_credits' && user_id && credits) {
      const { duelService } = await import('./duel.service');
      await duelService.handleCreditPurchase(user_id, parseInt(credits, 10));
      logger.info(`Duel credits purchased: ${credits} credits for user ${user_id}`);
      return;
    }

    if (session.mode === 'subscription') {
      await supabaseAdmin.from('subscriptions').insert({
        user_id,
        product_id,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({ status: 'succeeded', stripe_payment_intent_id: session.payment_intent })
      .eq('stripe_checkout_session_id', session.id);

    logger.info(`Payment completed for user ${user_id}, product ${product_id}`);
  }

  private async handleSubscriptionUpdate(subscription: any) {
    const status = subscription.cancel_at_period_end ? 'canceled' : subscription.status;

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  async getPaymentHistory(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, products(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message);
    return data || [];
  }

  async getSubscription(userId: string) {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('*, products(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return data;
  }

  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    // Check if user already has a subscription with customer ID
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (existing?.stripe_customer_id) return existing.stripe_customer_id;

    // Get user email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { user_id: userId },
    });

    return customer.id;
  }
}

export const paymentService = new PaymentService();
