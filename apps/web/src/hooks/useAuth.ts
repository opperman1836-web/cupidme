'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { createClient } from '@/lib/supabase/client';

/**
 * Sync the Supabase browser client's session with tokens from our auth store.
 * This ensures the Supabase JS SDK (used for Storage, Realtime, etc.) carries
 * the user's identity and passes RLS checks.
 */
async function syncSupabaseSession(accessToken: string, refreshToken: string) {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.warn('[Auth] Supabase session sync failed:', error.message);
    } else {
      console.info('[Auth] Supabase session synced successfully');
    }
  } catch (err) {
    console.warn('[Auth] Supabase session sync error:', err);
  }
}

/**
 * Single source of truth for post-login redirect.
 * Fetches the profile, caches the profileComplete flag, and navigates.
 *
 *   profile exists + complete → /discover
 *   profile missing or incomplete → /profile/edit
 *
 * This is the ONLY place that makes the post-login redirect decision.
 */
async function handlePostLoginRedirect(
  accessToken: string,
  router: ReturnType<typeof useRouter>,
) {
  const setProfileComplete = useAuthStore.getState().setProfileComplete;

  try {
    const res = await api.get<any>('/api/users/me', accessToken);
    const profile = res.data;

    if (profile?.profile_complete) {
      console.info('[Auth] Profile complete — redirecting to /discover');
      setProfileComplete(true);
      router.push('/discover');
    } else {
      console.info('[Auth] Profile incomplete or missing — redirecting to /profile/edit');
      setProfileComplete(false);
      router.push('/profile/edit');
    }
  } catch {
    // If profile fetch fails, assume incomplete — user can retry from onboarding
    console.warn('[Auth] Profile fetch failed — redirecting to /profile/edit');
    setProfileComplete(false);
    router.push('/profile/edit');
  }
}

export function useAuth() {
  const router = useRouter();
  const {
    accessToken, refreshToken, userId, isAuthenticated, profileComplete,
    setTokens, setProfileComplete, clearAuth,
  } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<any>('/api/auth/login', { email, password });
    const { access_token, refresh_token, user_id } = res.data;

    setTokens(access_token, refresh_token, user_id);
    console.info('[Auth] Login successful', { userId: user_id });

    // Sync Supabase client so Storage/Realtime carry the user's identity
    await syncSupabaseSession(access_token, refresh_token);

    // Deterministic redirect — single source of truth
    await handlePostLoginRedirect(access_token, router);
  }, [router, setTokens]);

  const register = useCallback(async (email: string, password: string, phone?: string) => {
    try {
      await api.post('/api/auth/register', { email, password, phone });
    } catch (err: any) {
      // If user already exists, try logging in directly
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        await login(email, password);
        return;
      }
      throw err;
    }
    // Registration succeeded — now login
    await login(email, password);
  }, [login]);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      console.warn('[Auth] No refresh token — cannot refresh session');
      clearAuth();
      router.push('/login');
      return null;
    }

    try {
      console.info('[Auth] Refreshing session...');
      const res = await api.post<any>('/api/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token: newRefresh } = res.data;

      setTokens(access_token, newRefresh, userId!);
      await syncSupabaseSession(access_token, newRefresh);
      console.info('[Auth] Session refreshed successfully');
      return access_token;
    } catch (err) {
      console.error('[Auth] Session refresh failed:', err);
      clearAuth();
      router.push('/login');
      return null;
    }
  }, [refreshToken, userId, setTokens, clearAuth, router]);

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await api.post('/api/auth/logout', {}, accessToken!);
      } catch { /* ignore */ }
    }
    // Also sign out the Supabase browser client
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }

    useChatStore.getState().clearAll();
    clearAuth();
    console.info('[Auth] Logged out');
    router.push('/login');
  }, [accessToken, clearAuth, router]);

  return {
    login, register, logout, refreshSession,
    accessToken, userId, isAuthenticated, profileComplete,
    setProfileComplete,
  };
}
