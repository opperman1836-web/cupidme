import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  accessToken?: string;
}

export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = header.split(' ')[1];
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Get user role from our users table
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (!user?.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    req.userId = data.user.id;
    req.userRole = user?.role || 'user';
    req.accessToken = token;
    next();
  } catch (err) {
    next(err);
  }
}
