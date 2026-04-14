import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';

export interface AuthRequest {
  userId?: string;
  userRole?: string;
  accessToken?: string;
  body: any;
  params: any;
  query: any;
  headers: any;
  ip?: string;
  method?: string;
  path?: string;
  url?: string;
  get?(name: string): string | undefined;
  [key: string]: any;
}

export async function requireAuth(
  req: AuthRequest,
  _res: any,
  next: any
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
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    // Self-healing: create users row if missing
    if (!user) {
      await supabaseAdmin
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email || '',
        }, { onConflict: 'id' });

      user = { role: 'user', is_active: true };
    }

    if (user.is_active === false) {
      throw new AppError('Account is deactivated', 403);
    }

    req.userId = data.user.id;
    req.userRole = user.role || 'user';
    req.accessToken = token;
    next();
  } catch (err) {
    next(err);
  }
}
