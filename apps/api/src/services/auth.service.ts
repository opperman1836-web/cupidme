import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthService {
  async register(email: string, password: string, phone?: string) {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
    });

    if (authError) {
      // User might already exist in auth — try to sign in instead
      if (authError.message.includes('already') || authError.message.includes('duplicate')) {
        throw new AppError('User already exists. Please log in.', 409);
      }
      throw new AppError(authError.message, 400);
    }

    // Step 2: Create user record in our users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        phone: phone || null,
      });

    if (userError) {
      logger.error('Users table insert failed — continuing anyway', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
      });

      // Don't rollback auth — the user CAN still log in
      // The users table row will be created on first authenticated request
      // via the auth middleware or we create it here with upsert
      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          email,
          phone: phone || null,
        }, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Users table upsert also failed', upsertError);
        // Still don't rollback — auth user exists, login will work
      }
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

    // Ensure users table row exists (self-healing)
    await supabaseAdmin
      .from('users')
      .upsert({
        id: data.user.id,
        email,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'id' });

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
