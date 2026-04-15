const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

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
