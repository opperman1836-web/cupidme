import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string, userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      setTokens: (access, refresh, userId) =>
        set({ accessToken: access, refreshToken: refresh, userId, isAuthenticated: true }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, userId: null, isAuthenticated: false }),
    }),
    { name: 'cupidme-auth' }
  )
);
