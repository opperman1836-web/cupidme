import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  /** Supabase user ID (UUID) */
  userId?: string;
  /** Role from the users table ('user' | 'admin') */
  userRole?: string;
  /** The raw Supabase access token from the Authorization header */
  accessToken?: string;
  /** Full Supabase user object returned by auth.getUser() */
  user?: User;
}

/**
 * Express middleware that validates Supabase JWTs.
 *
 * Flow:
 *  1. Extract Bearer token from Authorization header
 *  2. Validate via supabaseAdmin.auth.getUser(token)  — NOT jwt.verify()
 *  3. Look up the user row in the `users` table for role/active status
 *  4. Attach userId, userRole, accessToken, and user to the request
 *
 * Rejects with 401 if the token is missing, malformed, or expired.
 * Rejects with 403 if the account is deactivated.
 */
export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const requestPath = `${req.method} ${req.path}`;

  try {
    // ── Step 1: Extract token ──
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      logger.warn('[Auth] Missing or invalid Authorization header', {
        path: requestPath,
        hasHeader: !!header,
        headerPrefix: header ? header.substring(0, 10) + '...' : 'none',
      });
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = header.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      logger.warn('[Auth] Token present but empty/invalid value', {
        path: requestPath,
        tokenValue: token,
      });
      throw new AppError('Authorization token is empty', 401);
    }

    logger.info('[Auth] Token received', {
      path: requestPath,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
    });

    // ── Step 2: Validate with Supabase ──
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      logger.warn('[Auth] Supabase token validation failed', {
        path: requestPath,
        error: error?.message || 'No user returned',
        errorStatus: error?.status,
      });
      throw new AppError('Invalid or expired token', 401);
    }

    logger.info('[Auth] User ID extracted from token', {
      userId: data.user.id,
      email: data.user.email,
      path: requestPath,
    });

    // ── Step 3: Look up user in DB ──
    let { data: userRow } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (!userRow) {
      logger.info('[Auth] User not in DB — auto-creating row', {
        userId: data.user.id,
        path: requestPath,
      });
      await supabaseAdmin
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email || '',
        }, { onConflict: 'id' });

      userRow = { role: 'user', is_active: true };
    }

    if (userRow.is_active === false) {
      logger.warn('[Auth] Deactivated account attempted access', {
        userId: data.user.id,
        path: requestPath,
      });
      throw new AppError('Account is deactivated', 403);
    }

    // ── Step 4: Attach auth context to request ──
    req.userId = data.user.id;
    req.userRole = userRow.role || 'user';
    req.accessToken = token;
    req.user = data.user;

    const duration = Date.now() - startTime;
    logger.info('[Auth] Authenticated', {
      userId: data.user.id,
      role: userRow.role || 'user',
      path: requestPath,
      durationMs: duration,
    });

    next();
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err instanceof AppError) {
      logger.warn('[Auth] Rejected', {
        path: requestPath,
        status: err.statusCode,
        reason: err.message,
        durationMs: duration,
      });
    } else {
      logger.error('[Auth] Unexpected error during authentication', {
        path: requestPath,
        error: (err as Error).message,
        durationMs: duration,
      });
    }
    next(err);
  }
}
