import { z } from 'zod';

export const expressInterestSchema = z.object({
  to_user_id: z.string().uuid('Invalid user ID'),
});
