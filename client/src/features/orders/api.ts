import { api } from '@/shared/api-client';
import type { OrderDetail, OrderSummary } from './types';

export const ordersApi = {
  mine: (page: number, limit: number) => api.get<OrderSummary[]>('/orders/mine', { page, limit }),
  get: (orderNumber: string, phone?: string) =>
    api.get<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`, phone ? { phone } : undefined).then((r) => r.data),
};
