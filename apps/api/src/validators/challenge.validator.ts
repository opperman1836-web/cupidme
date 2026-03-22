import { z } from 'zod';

export const submitChallengeSchema = z.object({
  response_text: z.string().min(1, 'Response is required').max(2000),
});
