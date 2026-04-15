'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

export function useAuth() {
  const router = useRouter();
  const { accessToken, userId, isAuthenticated, setTokens, clearAuth } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<any>('/api/auth/login', { email, password });
    setTokens(res.data.access_token, res.data.refresh_token, res.data.user_id);

    // Check if profile is complete — send new users to onboarding, returning users to discover
    try {
      const profile = await api.get<any>('/api/users/me', res.data.access_token);
      if (profile.data?.profile_complete) {
        router.push('/discover');
      } else {
        router.push('/profile/edit');
      }
    } catch {
      router.push('/profile/edit');
    }
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

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await api.post('/api/auth/logout', {}, accessToken!);
      } catch { /* ignore */ }
    }
    useChatStore.getState().clearAll();
    clearAuth();
    router.push('/login');
  }, [accessToken, clearAuth, router]);

  return { login, register, logout, accessToken, userId, isAuthenticated };
}
