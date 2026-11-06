import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth.store';
import { ordersApi } from './api';

export function useMyOrders(page = 1, limit = 10) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['orders', 'mine', userId, page, limit],
    queryFn: () => ordersApi.mine(page, limit),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

/** For the owner (logged in) or a guest who gives the phone number. */
export function useOrder(orderNumber: string | null, phone?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ['order', orderNumber, userId ?? 'guest', phone ?? ''],
    queryFn: () => ordersApi.get(orderNumber!, phone),
    enabled: Boolean(orderNumber) && status !== 'unknown' && (Boolean(userId) || Boolean(phone)),
    retry: false,
  });
}
