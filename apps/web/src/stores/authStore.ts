import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  /**
   * Cached profile_complete flag from the server.
   * - null = unknown (haven't checked yet)
   * - false = profile incomplete → onboarding required
   * - true = profile complete → go to /discover
   *
   * This is synced after login and after profile save.
   * ProfileGate and useAuth both read this for instant redirect decisions.
   */
  profileComplete: boolean | null;
  setTokens: (access: string, refresh: string, userId: string) => void;
  setProfileComplete: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      profileComplete: null,
      setTokens: (access, refresh, userId) =>
        set({ accessToken: access, refreshToken: refresh, userId, isAuthenticated: true }),
      setProfileComplete: (value) =>
        set({ profileComplete: value }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          isAuthenticated: false,
          profileComplete: null,
        }),
    }),
    { name: 'cupidme-auth' }
  )
);
