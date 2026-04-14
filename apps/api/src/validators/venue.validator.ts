import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['coffee_shop', 'restaurant', 'bar', 'activity', 'experience']),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

export const createOfferSchema = z.object({
  venue_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  offer_type: z.enum(['percentage_discount', 'fixed_discount', 'free_item', 'special_menu']),
  discount_value: z.number().optional(),
  min_connection_level: z.number().int().min(1).max(10).optional(),
  max_redemptions: z.number().int().optional(),
  valid_from: z.string(),
  valid_until: z.string(),
});
