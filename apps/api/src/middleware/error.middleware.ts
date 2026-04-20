import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global error handler. Produces a consistent response shape:
 *   { success: false, message: string, error: string }
 *
 * The internal error (stack, code, details) is logged but NEVER returned to the client.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) return;

  // Known AppError — safe to return the message to the client
  if (err instanceof AppError) {
    logger.warn('app_error', {
      path: `${req.method} ${req.originalUrl}`,
      status: err.statusCode,
      message: err.message,
    });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }

  // Postgres error codes — translate to safe user-facing messages
  const pgError = err as any;
  if (pgError.code === '23505') {
    logger.warn('pg_unique_violation', {
      path: `${req.method} ${req.originalUrl}`,
      detail: pgError.detail,
    });
    return res.status(409).json({
      success: false,
      message: 'Record already exists',
      error: 'Record already exists',
    });
  }
  if (pgError.code === '23503') {
    logger.warn('pg_fk_violation', {
      path: `${req.method} ${req.originalUrl}`,
      detail: pgError.detail,
    });
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found',
      error: 'Referenced record not found',
    });
  }
  if (pgError.code === '23514') {
    logger.warn('pg_check_violation', {
      path: `${req.method} ${req.originalUrl}`,
      detail: pgError.detail,
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Validation failed',
    });
  }

  // Unknown error — log full details internally, return generic message to client
  logger.error('unhandled_error', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: 'Internal server error',
  });
}
