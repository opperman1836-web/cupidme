import { z } from 'zod';

export const createInviteSchema = z.object({
  duel_id: z.string().uuid('Invalid duel ID'),
});

export const acceptInviteSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Name is required').max(50),
});

export const trackShareSchema = z.object({
  duel_id: z.string().uuid('Invalid duel ID'),
  platform: z.enum(['copy', 'whatsapp', 'twitter', 'native', 'other']),
});
