import { createBrowserClient } from '@supabase/ssr';
import { useAuthStore } from '@/stores/authStore';

/**
 * Create an anonymous Supabase browser client (no user session).
 * Use for public reads and non-auth contexts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Create a Supabase browser client with the current user's session injected.
 * Required for operations that need RLS enforcement (e.g., Storage uploads).
 *
 * Reads access_token and refresh_token from the Zustand auth store
 * and calls supabase.auth.setSession() to authenticate the client.
 *
 * Returns { client, error } — check error before using the client.
 */
export async function createAuthenticatedClient() {
  const { accessToken, refreshToken } = useAuthStore.getState();

  if (!accessToken || !refreshToken) {
    console.error('[Supabase] Cannot create authenticated client — no tokens in store');
    return { client: null, error: new Error('Not authenticated') };
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('[Supabase] Failed to set session on client:', error.message);
    return { client: null, error };
  }

  console.info('[Supabase] Authenticated client created successfully');
  return { client, error: null };
}
