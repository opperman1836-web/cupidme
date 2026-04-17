import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
  _isRetry?: boolean;
}

/**
 * Get the current access token — uses explicit token if provided,
 * otherwise reads from the Zustand auth store automatically.
 */
function resolveToken(explicit?: string): string | null {
  if (explicit) return explicit;
  return useAuthStore.getState().accessToken;
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Updates the Zustand store with new tokens on success.
 * Returns the new access token, or null if refresh failed.
 */
async function tryRefreshToken(): Promise<string | null> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
  if (!refreshToken) {
    console.warn('[Auth] No refresh token available — clearing session');
    clearAuth();
    return null;
  }

  try {
    console.info('[Auth] Access token expired — attempting refresh...');
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      console.warn('[Auth] Refresh failed — clearing session and redirecting to login');
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    const data = await res.json();
    const { access_token, refresh_token: newRefresh } = data.data;
    const userId = useAuthStore.getState().userId;
    setTokens(access_token, newRefresh, userId!);
    console.info('[Auth] Token refreshed successfully');
    return access_token;
  } catch (err) {
    console.error('[Auth] Refresh request failed:', err);
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token: explicitToken, _isRetry, ...fetchOptions } = options;

  const token = resolveToken(explicitToken);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${path}`;

  // Retry logic for cold-start (Render free tier takes ~50s to wake)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attempt === 0 ? 60000 : 90000);

      const res = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle 401 — attempt token refresh once, then retry
      if (res.status === 401 && !_isRetry && !path.includes('/auth/')) {
        console.warn(`[Auth] 401 on ${path} — token may be expired`);
        const newToken = await tryRefreshToken();
        if (newToken) {
          return apiFetch<T>(path, { ...options, token: newToken, _isRetry: true });
        }
        throw new Error('Session expired. Please log in again.');
      }

      // Try to parse JSON
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed (${res.status})`);
      }

      return data;
    } catch (err: any) {
      lastError = err;

      // If aborted (timeout) or network error, retry once
      if (attempt === 0 && (err.name === 'AbortError' || err.message === 'Failed to fetch')) {
        console.warn(`API request to ${path} failed, retrying... (server may be waking up)`);
        continue;
      }

      // Better error messages for common cases
      if (err.name === 'AbortError') {
        throw new Error('Server is warming up — this takes about 30 seconds on first use. Please try again.');
      }
      if (err.message === 'Failed to fetch') {
        throw new Error('Connecting to server... Please wait a moment and try again.');
      }

      throw err;
    }
  }

  throw lastError || new Error('Request failed');
}

export const api = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
};
