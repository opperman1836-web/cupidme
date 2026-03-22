import { supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { calculateAge } from '../utils/helpers';

export class UserService {
  async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, user_photos(*), user_interests(*)')
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundError('Profile');
    return data;
  }

  async createProfile(userId: string, input: {
    display_name: string;
    bio?: string;
    date_of_birth: string;
    gender: string;
    gender_preference: string;
    city: string;
    province?: string;
    latitude?: number;
    longitude?: number;
    max_distance_km?: number;
    age_range_min?: number;
    age_range_max?: number;
  }) {
    const age = calculateAge(input.date_of_birth);
    if (age < 18) throw new AppError('Must be at least 18 years old');

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({ user_id: userId, ...input })
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }

  async addPhoto(userId: string, url: string, position: number) {
    const { data, error } = await supabaseAdmin
      .from('user_photos')
      .upsert({ user_id: userId, url, position, is_primary: position === 1 }, {
        onConflict: 'user_id,position',
      })
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }

  async deletePhoto(userId: string, photoId: string) {
    const { error } = await supabaseAdmin
      .from('user_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (error) throw new AppError(error.message);
  }

  async setInterests(userId: string, interests: { interest_tag: string; category: string }[]) {
    // Clear existing and re-insert
    await supabaseAdmin.from('user_interests').delete().eq('user_id', userId);

    if (interests.length === 0) return [];

    const rows = interests.slice(0, 10).map((i) => ({ user_id: userId, ...i }));
    const { data, error } = await supabaseAdmin
      .from('user_interests')
      .insert(rows)
      .select();

    if (error) throw new AppError(error.message);
    return data;
  }

  async getDiscoverFeed(userId: string, page = 1, limit = 20) {
    // Get current user's profile for preferences
    const { data: myProfile } = await supabaseAdmin
      .from('profiles')
      .select('gender_preference, city, max_distance_km, age_range_min, age_range_max')
      .eq('user_id', userId)
      .single();

    if (!myProfile) throw new AppError('Complete your profile first');

    // Get users already expressed interest in or matched with
    const { data: excluded } = await supabaseAdmin
      .from('expressed_interests')
      .select('to_user_id')
      .eq('from_user_id', userId);

    const excludedIds = [userId, ...(excluded?.map((e) => e.to_user_id) || [])];

    let query = supabaseAdmin
      .from('profiles')
      .select('*, user_photos(url, position, is_primary), users!inner(is_active, is_verified)')
      .eq('profile_complete', true)
      .eq('users.is_active', true)
      .not('user_id', 'in', `(${excludedIds.join(',')})`)
      .range((page - 1) * limit, page * limit - 1);

    // Gender preference filter
    if (myProfile.gender_preference !== 'everyone') {
      query = query.eq('gender', myProfile.gender_preference);
    }

    const { data, error } = await query;
    if (error) throw new AppError(error.message);
    return data || [];
  }

  async submitVerification(userId: string, selfieUrl: string) {
    const { data, error } = await supabaseAdmin
      .from('user_verifications')
      .upsert({ user_id: userId, selfie_url: selfieUrl, status: 'pending' }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }
}

export const userService = new UserService();
