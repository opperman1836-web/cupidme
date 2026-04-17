import { supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { calculateAge } from '../utils/helpers';
import { logger } from '../utils/logger';
import { toCanonicalProfile, CanonicalProfile } from '../utils/profile-mapper';

export class UserService {
  /**
   * Fetch profile + photos + interests in parallel, return canonical shape.
   * Uses separate queries (no PostgREST relationship assumption).
   */
  async getProfile(userId: string): Promise<CanonicalProfile | null> {
    const [profileRes, photosRes, interestsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('user_photos').select('url, position, is_primary').eq('user_id', userId),
      supabaseAdmin.from('user_interests').select('interest_tag, category').eq('user_id', userId),
    ]);

    if (profileRes.error) {
      logger.error('[Profile] Fetch failed', { userId, error: profileRes.error.message });
      return null;
    }
    if (!profileRes.data) return null;

    // Pull is_verified off the users table
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('is_verified')
      .eq('id', userId)
      .maybeSingle();

    return toCanonicalProfile(
      { ...profileRes.data, is_verified: userRow?.is_verified },
      { photos: photosRes.data || [], interests: interestsRes.data || [] }
    );
  }

  /**
   * Upsert profile — always forces profile_complete = true when required fields exist.
   * Returns canonical shape.
   */
  async upsertProfile(userId: string, input: {
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
  }): Promise<CanonicalProfile> {
    const age = calculateAge(input.date_of_birth);
    if (age < 18) throw new AppError('Must be at least 18 years old');

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        ...input,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      logger.error('[Profile] Upsert failed', { userId, error: error.message, code: error.code });
      throw new AppError(error.message);
    }

    const profile = await this.getProfile(userId);
    if (!profile) throw new AppError('Profile not found after upsert');
    return profile;
  }

  /**
   * Partial update — never resets profile_complete.
   */
  async updateProfile(userId: string, updates: {
    display_name?: string;
    bio?: string;
    date_of_birth?: string;
    gender?: string;
    gender_preference?: string;
    city?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
    max_distance_km?: number;
    age_range_min?: number;
    age_range_max?: number;
  }): Promise<CanonicalProfile> {
    if (updates.date_of_birth) {
      const age = calculateAge(updates.date_of_birth);
      if (age < 18) throw new AppError('Must be at least 18 years old');
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      logger.error('[Profile] Update failed', { userId, error: error.message });
      throw new AppError(error.message);
    }

    const profile = await this.getProfile(userId);
    if (!profile) throw new NotFoundError('Profile not found. Create one first.');
    return profile;
  }

  /**
   * Replace-all photos. Deletes existing, inserts new.
   * This is the canonical photos write path — use this instead of addPhoto for the save flow.
   */
  async replacePhotos(userId: string, urls: string[]): Promise<string[]> {
    await supabaseAdmin.from('user_photos').delete().eq('user_id', userId);

    if (urls.length === 0) return [];

    const rows = urls.slice(0, 10).map((url, idx) => ({
      user_id: userId,
      url,
      position: idx + 1,
      is_primary: idx === 0,
    }));

    const { error } = await supabaseAdmin.from('user_photos').insert(rows);
    if (error) {
      logger.error('[Photos] Replace failed', { userId, error: error.message });
      throw new AppError(error.message);
    }

    logger.info('[Photos] Replaced', { userId, count: urls.length });
    return urls;
  }

  /** Legacy single-photo add — kept for backward compat. */
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

  async getDiscoverFeed(userId: string, page = 1, limit = 20): Promise<CanonicalProfile[]> {
    const { data: myProfile } = await supabaseAdmin
      .from('profiles')
      .select('gender_preference, city, max_distance_km, age_range_min, age_range_max')
      .eq('user_id', userId)
      .maybeSingle();

    if (!myProfile) return [];

    const { data: excluded } = await supabaseAdmin
      .from('expressed_interests')
      .select('to_user_id')
      .eq('from_user_id', userId);

    const excludedIds = [userId, ...(excluded?.map((e) => e.to_user_id) || [])];

    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('profile_complete', true)
      .not('user_id', 'in', `(${excludedIds.join(',')})`)
      .range((page - 1) * limit, page * limit - 1);

    if (myProfile.gender_preference !== 'everyone') {
      query = query.eq('gender', myProfile.gender_preference);
    }

    const { data: profileRows, error } = await query;
    if (error) throw new AppError(error.message);
    if (!profileRows || profileRows.length === 0) return [];

    const userIds = profileRows.map((p: any) => p.user_id);
    const [photosRes, interestsRes] = await Promise.all([
      supabaseAdmin.from('user_photos').select('user_id, url, position, is_primary').in('user_id', userIds),
      supabaseAdmin.from('user_interests').select('user_id, interest_tag, category').in('user_id', userIds),
    ]);

    const photosByUser = new Map<string, any[]>();
    (photosRes.data || []).forEach((p: any) => {
      const list = photosByUser.get(p.user_id) || [];
      list.push(p);
      photosByUser.set(p.user_id, list);
    });

    const interestsByUser = new Map<string, any[]>();
    (interestsRes.data || []).forEach((i: any) => {
      const list = interestsByUser.get(i.user_id) || [];
      list.push(i);
      interestsByUser.set(i.user_id, list);
    });

    return profileRows.map((p: any) =>
      toCanonicalProfile(p, {
        photos: photosByUser.get(p.user_id) || [],
        interests: interestsByUser.get(p.user_id) || [],
      })
    );
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
