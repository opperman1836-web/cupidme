export type ProductType = 'one_time' | 'subscription';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  stripe_product_id: string;
  stripe_price_id: string;
  amount_zar: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  product_id: string;
  match_id: string | null;
  stripe_payment_intent_id: string;
  stripe_checkout_session_id: string | null;
  amount_zar: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export const PRODUCTS = {
  MATCH_UNLOCK: { name: 'Match Unlock', amount_zar: 2900 },
  CHAT_EXTENSION: { name: 'Chat Extension (24h)', amount_zar: 1900 },
  CUPIDME_PLUS: { name: 'CupidMe Plus', amount_zar: 14900 },
  CUPIDME_PREMIUM: { name: 'CupidMe Premium', amount_zar: 29900 },
  VENUE_BASIC: { name: 'Venue Basic', amount_zar: 49900 },
  VENUE_PRO: { name: 'Venue Pro', amount_zar: 99900 },
} as const;
