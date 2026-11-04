import { api } from '@/shared/api-client';
import type { Category, CollectionData, HomeData, ProductDetailData, ProductListParams, ProductSummary } from './types';

export const productsApi = {
  list: (params: ProductListParams = {}, signal?: AbortSignal) =>
    api.get<ProductSummary[]>('/products', { ...params }, signal),

  collection: (slug: string, params: ProductListParams = {}, signal?: AbortSignal) =>
    api.get<CollectionData>(`/categories/${encodeURIComponent(slug)}/products`, { ...params }, signal),

  home: (signal?: AbortSignal) => api.get<HomeData>('/home', undefined, signal),

  bySlug: (slug: string, signal?: AbortSignal) =>
    api.get<ProductDetailData>(`/products/${encodeURIComponent(slug)}`, undefined, signal),

  categories: (signal?: AbortSignal) => api.get<Category[]>('/categories', undefined, signal),
};
