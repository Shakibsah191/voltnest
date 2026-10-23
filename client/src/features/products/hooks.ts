import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsApi } from './api';
import type { ProductListParams } from './types';

/** One place for query keys, so cache invalidation stays predictable. */
export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => [...productKeys.all, 'list', params] as const,
  detail: (slug: string) => [...productKeys.all, 'detail', slug] as const,
  home: ['home'] as const,
  categories: ['categories'] as const,
};

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useHome() {
  return useQuery({
    queryKey: productKeys.home,
    queryFn: ({ signal }) => productsApi.home(signal).then((r) => r.data),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }) => productsApi.bySlug(slug, signal).then((r) => r.data),
    enabled: Boolean(slug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: ({ signal }) => productsApi.categories(signal).then((r) => r.data),
    staleTime: 10 * 60_000, // categories rarely change
  });
}
