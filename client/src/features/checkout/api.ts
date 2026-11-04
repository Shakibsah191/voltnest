import { api } from '@/shared/api-client';
import type { CheckoutOptions, OrderConfirmation, PlaceOrderInput } from './types';

export const checkoutApi = {
  options: () => api.get<CheckoutOptions>('/checkout/options').then((r) => r.data),
  placeOrder: (input: PlaceOrderInput) => api.post<OrderConfirmation>('/orders', input).then((r) => r.data),
};
