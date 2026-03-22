import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PORT: parseInt(process.env.API_PORT || '4000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  // Claude
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
} as const;
