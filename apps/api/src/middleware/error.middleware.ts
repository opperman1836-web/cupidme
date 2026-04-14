import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Prevent double-send
  if (res.headersSent) return;

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle Supabase/Postgres specific errors
  const pgError = err as any;
  if (pgError.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Record already exists',
    });
  }
  if (pgError.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record not found',
    });
  }
  if (pgError.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
    });
  }

  console.error('Unhandled error:', err.message || err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
