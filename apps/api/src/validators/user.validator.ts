import { z } from 'zod';

export const createProfileSchema = z.object({
  display_name: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  date_of_birth: z.string(),
  gender: z.enum(['male', 'female', 'non_binary', 'other']),
  gender_preference: z.enum(['male', 'female', 'non_binary', 'everyone']),
  city: z.string().min(1),
  province: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  max_distance_km: z.number().int().min(1).max(500).optional(),
  age_range_min: z.number().int().min(18).optional(),
  age_range_max: z.number().int().max(100).optional(),
});

export const addPhotoSchema = z.object({
  url: z.string().url(),
  position: z.number().int().min(1).max(6),
});

export const setInterestsSchema = z.object({
  interests: z.array(z.object({
    interest_tag: z.string(),
    category: z.string(),
  })).max(10),
});
