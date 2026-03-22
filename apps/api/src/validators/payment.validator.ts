import { z } from 'zod';

export const createCheckoutSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  match_id: z.string().uuid().optional(),
});
