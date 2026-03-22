import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client with service role key — bypasses RLS
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a client scoped to a user's JWT for RLS-enforced queries
export function supabaseForUser(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
