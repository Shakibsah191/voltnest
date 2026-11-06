import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productKeys } from '@/features/products/hooks';
import { reviewsApi } from './api';
import type { CreateReviewInput } from './types';

export function useProductReviews(slug: string) {
  return useInfiniteQuery({
    queryKey: ['reviews', slug],
    queryFn: ({ pageParam }) => reviewsApi.forProduct(slug, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: Boolean(slug),
  });
}

export function useCreateReview(productSlug: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsApi.create(input),
    onSuccess: () => {
      // the order page shows "Reviewed", the product page shows the new review and rating
      void queryClient.invalidateQueries({ queryKey: ['order'] });
      if (productSlug) {
        void queryClient.invalidateQueries({ queryKey: ['reviews', productSlug] });
        void queryClient.invalidateQueries({ queryKey: productKeys.detail(productSlug) });
      }
    },
  });
}
