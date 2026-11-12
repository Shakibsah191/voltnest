import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth.store';
import { adminApi } from './api';
import type { StatusUpdateInput } from './types';

/** Is the logged-in person the owner? Staff see the same panel without money or product editing. */
export function useIsOwner() {
  return useAuthStore((s) => s.user?.role === 'admin');
}

export function useAdminMe() {
  return useQuery({ queryKey: ['admin', 'me'], queryFn: adminApi.me, staleTime: 5 * 60_000 });
}

export function useDashboard() {
  return useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard, refetchInterval: 60_000 });
}

export function useAdminOrders(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminApi.orders(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000, // new orders appear without refreshing the page
  });
}

export function useAdminOrder(orderNumber: string) {
  return useQuery({ queryKey: ['admin', 'order', orderNumber], queryFn: () => adminApi.order(orderNumber) });
}

export function useUpdateOrderStatus(orderNumber: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StatusUpdateInput) => adminApi.updateStatus(orderNumber, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useEditOrder(orderNumber: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof adminApi.editOrder>[1]) => adminApi.editOrder(orderNumber, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'order', orderNumber] }),
  });
}

export function useAdminProducts(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: ['admin', 'products', params], queryFn: () => adminApi.products(params), placeholderData: keepPreviousData });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({ queryKey: ['admin', 'product', id], queryFn: () => adminApi.product(id!), enabled: Boolean(id) });
}

export function useSaveProduct(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => (id ? adminApi.updateProduct(id, body) : adminApi.createProduct(body)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['products'] }); // the shop pages
    },
  });
}

export function useSetStock(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variants: { sku: string; stock: number }[]) => adminApi.setStock(id, variants),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useStaff() {
  return useQuery({ queryKey: ['admin', 'staff'], queryFn: adminApi.staff });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: adminApi.createStaff, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'staff'] }) });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; isActive?: boolean; password?: string }) => adminApi.updateStaff(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  });
}
