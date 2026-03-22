export type UserRole = 'user' | 'venue_owner' | 'admin';
export type Gender = 'male' | 'female' | 'non_binary' | 'other';
export type GenderPreference = 'male' | 'female' | 'non_binary' | 'everyone';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  date_of_birth: string;
  gender: Gender;
  gender_preference: GenderPreference;
  city: string;
  province: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  max_distance_km: number;
  age_range_min: number;
  age_range_max: number;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPhoto {
  id: string;
  user_id: string;
  url: string;
  position: number;
  is_primary: boolean;
  created_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest_tag: string;
  category: string;
}

export interface UserVerification {
  id: string;
  user_id: string;
  selfie_url: string | null;
  status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileInput {
  display_name: string;
  bio?: string;
  date_of_birth: string;
  gender: Gender;
  gender_preference: GenderPreference;
  city: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  max_distance_km?: number;
  age_range_min?: number;
  age_range_max?: number;
}
