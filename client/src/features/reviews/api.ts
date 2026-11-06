import { api } from '@/shared/api-client';
import type { CreateReviewInput, Review, ReviewSummary } from './types';

export const reviewsApi = {
  forProduct: (slug: string, page: number, limit = 5) =>
    api.get<{ summary: ReviewSummary; items: Review[] }>(`/products/${encodeURIComponent(slug)}/reviews`, { page, limit }),
  create: (input: CreateReviewInput) => api.post<Review>('/reviews', input).then((r) => r.data),
};
