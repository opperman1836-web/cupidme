import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthService {
  async register(email: string, password: string, phone?: string) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: false,
    });

    if (authError) {
      throw new AppError(authError.message, 400);
    }

    // Create user record in our users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        phone: phone || null,
      });

    if (userError) {
      logger.error('Failed to create user record', userError);
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new AppError('Registration failed', 500);
    }

    return { user_id: authData.user.id };
  }

  async login(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last_seen
    await supabaseAdmin
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', data.user.id);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user_id: data.user.id,
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new AppError('Invalid refresh token', 401);
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }

  async logout(userId: string) {
    await supabaseAdmin
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
  }
}

export const authService = new AuthService();
