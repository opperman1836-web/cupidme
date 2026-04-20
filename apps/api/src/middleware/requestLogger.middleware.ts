import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import type { AuthRequest } from './auth.middleware';

/**
 * Structured request logger.
 * Logs every completed request with method, route, status, duration, and user_id (if auth ran).
 *
 * Silent for /health and static assets to avoid noise.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Skip health checks and preflight
  if (originalUrl === '/health' || originalUrl === '/api/health' || method === 'OPTIONS') {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as AuthRequest).userId;
    const { statusCode } = res;

    const meta = {
      method,
      route: originalUrl,
      status: statusCode,
      durationMs: duration,
      userId: userId || null,
    };

    if (statusCode >= 500) {
      logger.error('http_request', meta);
    } else if (statusCode >= 400) {
      logger.warn('http_request', meta);
    } else {
      logger.info('http_request', meta);
    }
  });

  next();
}
