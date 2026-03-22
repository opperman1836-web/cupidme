'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const router = useRouter();
  const { accessToken, userId, isAuthenticated, setTokens, clearAuth } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<any>('/api/auth/login', { email, password });
    setTokens(res.data.access_token, res.data.refresh_token, res.data.user_id);
    router.push('/discover');
  }, [router, setTokens]);

  const register = useCallback(async (email: string, password: string, phone?: string) => {
    await api.post('/api/auth/register', { email, password, phone });
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await api.post('/api/auth/logout', {}, accessToken);
      } catch { /* ignore */ }
    }
    clearAuth();
    router.push('/login');
  }, [accessToken, clearAuth, router]);

  return { login, register, logout, accessToken, userId, isAuthenticated };
}
