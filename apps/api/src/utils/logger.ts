function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const obj = { ...(data as Record<string, unknown>) };
  const sensitive = ['password', 'token', 'access_token', 'refresh_token', 'secret', 'stripe_secret', 'api_key'];
  for (const key of sensitive) {
    if (key in obj) obj[key] = '[REDACTED]';
  }
  return obj;
}

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...(data ? { data: sanitize(data) } : {}),
    }));
  },
  error: (message: string, error?: unknown) => {
    const errorData = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 3).join('\n') }
      : error;
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...(errorData ? { error: sanitize(errorData) } : {}),
    }));
  },
  warn: (message: string, data?: unknown) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...(data ? { data: sanitize(data) } : {}),
    }));
  },
};
