import { z } from 'zod';

export const createDuelSchema = z.object({
  opponent_id: z.string().uuid('Invalid opponent ID').optional(),
  match_id: z.string().uuid('Invalid match ID').optional(),
  type: z.enum(['compatibility', 'icebreaker', 'deep_connection', 'fun', 'rapid_fire']).optional(),
});

export const startDuelSchema = z.object({});

export const answerDuelSchema = z.object({
  question_id: z.string().uuid('Invalid question ID'),
  answer: z.string().min(1, 'Answer is required'),
  answered_in_seconds: z.number().min(0).max(60).optional(),
});

export const purchaseCreditsSchema = z.object({
  package: z.enum(['5_credits', '20_credits']),
});

export const rejectDuelSchema = z.object({
  reason: z.string().max(280).optional(),
});
