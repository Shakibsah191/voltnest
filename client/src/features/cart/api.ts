import { api } from '@/shared/api-client';
import type { Cart } from './types';

const sku = (s: string) => encodeURIComponent(s);

export const cartApi = {
  get: (signal?: AbortSignal) => api.get<Cart>('/cart', undefined, signal).then((r) => r.data),
  add: (input: { sku: string; quantity: number }) => api.post<Cart>('/cart/items', input).then((r) => r.data),
  setQuantity: (input: { sku: string; quantity: number }) =>
    api.patch<Cart>(`/cart/items/${sku(input.sku)}`, { quantity: input.quantity }).then((r) => r.data),
  remove: (variantSku: string) => api.delete<Cart>(`/cart/items/${sku(variantSku)}`).then((r) => r.data),
  import: (items: { sku: string; quantity: number }[]) => api.post<Cart>('/cart/import', { items }).then((r) => r.data),
};
