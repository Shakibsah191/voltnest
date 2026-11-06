import { z } from 'zod';

export const createReviewSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(5).max(30),
  productId: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid product'),
  rating: z.coerce
    .number({ required_error: 'Choose a star rating' })
    .int()
    .min(1, 'Choose a star rating')
    .max(5, 'Choose a star rating'),
  title: z.string().trim().max(120, 'Keep the title under 120 characters').optional().default(''),
  body: z.string().trim().max(2000, 'Keep the review under 2,000 characters').optional().default(''),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const listReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
