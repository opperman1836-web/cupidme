import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';

export class NotificationService {
  async create(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({ user_id: userId, type, title, body, data: data || null });

    if (error) throw new AppError(error.message);
  }

  async getUnread(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new AppError(error.message);
    return data || [];
  }

  async markRead(notificationId: string, userId: string) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }

  async markAllRead(userId: string) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  }
}

export const notificationService = new NotificationService();
