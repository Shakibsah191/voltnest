import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productsApi } from './api';
import type { ProductListParams } from './types';

/** One place for query keys, so cache invalidation stays predictable. */
export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => [...productKeys.all, 'list', params] as const,
  search: (q: string) => [...productKeys.all, 'search', q] as const,
  collection: (slug: string, params: ProductListParams) => [...productKeys.all, 'collection', slug, params] as const,
  detail: (slug: string) => [...productKeys.all, 'detail', slug] as const,
  home: ['home'] as const,
  categories: ['categories'] as const,
};

const nextPage = (meta?: { page: number; totalPages: number }) =>
  meta && meta.page < meta.totalPages ? meta.page + 1 : undefined;

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

/** Collection page: category info + facets (page 1) + products with "Load more". */
export function useCollection(slug: string, params: ProductListParams, pageSize = 12) {
  return useInfiniteQuery({
    queryKey: productKeys.collection(slug, { ...params, limit: pageSize }),
    queryFn: ({ pageParam, signal }) => productsApi.collection(slug, { ...params, page: pageParam, limit: pageSize }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.meta),
    placeholderData: keepPreviousData,
    enabled: Boolean(slug),
  });
}

export function useSearch(q: string, pageSize = 12) {
  return useInfiniteQuery({
    queryKey: productKeys.search(q),
    queryFn: ({ pageParam, signal }) => productsApi.list({ q, page: pageParam, limit: pageSize }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.meta),
    enabled: q.trim().length > 0,
  });
}

/** Small list for the mega menu (e.g. the 3 bestsellers in a category). Only fetches when enabled. */
export function useCategoryTop(slug: string, enabled: boolean, limit = 3) {
  return useQuery({
    queryKey: productKeys.collection(slug, { sort: 'bestselling', limit }),
    queryFn: ({ signal }) => productsApi.collection(slug, { sort: 'bestselling', limit }, signal).then((r) => r.data.items),
    enabled,
    staleTime: 5 * 60_000,
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
