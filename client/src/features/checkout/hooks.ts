import { useMutation, useQuery } from '@tanstack/react-query';
import { checkoutApi } from './api';
import type { CheckoutOptions, OrderConfirmation } from './types';

/** Zones, charges and the free-delivery line. They rarely change, so fetch once per visit. */
export function useCheckoutOptions() {
  return useQuery({ queryKey: ['checkout-options'], queryFn: checkoutApi.options, staleTime: Infinity });
}

export function usePlaceOrder() {
  return useMutation({ mutationFn: checkoutApi.placeOrder });
}

/** Charge for a zone, given the cart subtotal. Display only: the server decides the real one. */
export function deliveryChargeFor(options: CheckoutOptions | undefined, zoneId: string, subtotal: number) {
  const zone = options?.zones.find((z) => z.id === zoneId);
  if (!options || !zone) return null;
  return subtotal >= options.freeDeliveryThreshold ? 0 : zone.charge;
}

// The success page reads the confirmation from here, so a reload still shows it.
const orderKey = (orderNumber: string) => `voltnest-order:${orderNumber}`;

export function rememberOrder(order: OrderConfirmation) {
  try {
    sessionStorage.setItem(orderKey(order.orderNumber), JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function recallOrder(orderNumber: string): OrderConfirmation | null {
  try {
    const raw = sessionStorage.getItem(orderKey(orderNumber));
    return raw ? (JSON.parse(raw) as OrderConfirmation) : null;
  } catch {
    return null;
  }
}
