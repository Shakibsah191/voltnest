import { api, apiRequest } from '@/shared/api-client';
import type {
  AdminMe,
  AdminOrder,
  AdminOrderRow,
  AdminProductRow,
  Dashboard,
  ProductForm,
  StaffMember,
  StatusUpdateInput,
  UploadSignature,
} from './types';

const enc = encodeURIComponent;

export const adminApi = {
  me: () => api.get<AdminMe>('/admin/me').then((r) => r.data),
  dashboard: () => api.get<Dashboard>('/admin/dashboard').then((r) => r.data),

  orders: (params: Record<string, string | number | undefined>) => api.get<AdminOrderRow[]>('/admin/orders', params),
  order: (n: string) => api.get<AdminOrder>(`/admin/orders/${enc(n)}`).then((r) => r.data),
  updateStatus: (n: string, input: StatusUpdateInput) =>
    api.patch<{ status: string }>(`/admin/orders/${enc(n)}/status`, input).then((r) => r.data),
  editOrder: (n: string, input: { courier?: { name: string; trackingNumber?: string }; expectedDeliveryDate?: string }) =>
    api.patch(`/admin/orders/${enc(n)}`, input),

  products: (params: Record<string, string | number | undefined>) => api.get<AdminProductRow[]>('/admin/products', params),
  product: (id: string) => api.get<ProductForm & { id: string }>(`/admin/products/${id}`).then((r) => r.data),
  createProduct: (body: unknown) => api.post<{ id: string; slug: string }>('/admin/products', body).then((r) => r.data),
  updateProduct: (id: string, body: unknown) =>
    apiRequest<{ id: string; slug: string }>(`/admin/products/${id}`, { method: 'PUT', body }).then((r) => r.data),
  setStock: (id: string, variants: { sku: string; stock: number }[]) =>
    api.patch<{ totalStock: number }>(`/admin/products/${id}/stock`, { variants }).then((r) => r.data),
  uploadSignature: () => api.post<UploadSignature>('/admin/uploads/signature').then((r) => r.data),

  staff: () => api.get<StaffMember[]>('/admin/staff').then((r) => r.data),
  createStaff: (body: { name: string; email: string; password: string }) => api.post('/admin/staff', body),
  updateStaff: (id: string, body: { isActive?: boolean; password?: string; name?: string }) => api.patch(`/admin/staff/${id}`, body),
};

/** Sends the photo straight from the browser to Cloudinary, using a signature from our server. */
export async function uploadImage(file: File): Promise<string> {
  const sig = await adminApi.uploadSignature();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);
  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) throw new Error(json?.error?.message ?? 'The photo didn’t upload. Try a smaller JPG or PNG.');
  return json.secure_url as string;
}
