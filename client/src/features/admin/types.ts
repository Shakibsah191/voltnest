import type { OrderStatus } from '@/features/orders/types';

export interface AdminMe {
  role: 'staff' | 'admin';
  uploadsEnabled: boolean;
}

export interface DueOrder {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  zone: string;
  total: number;
  expectedDeliveryDate: string;
  late: boolean;
}

export interface Dashboard {
  today: { orders: number; revenue?: number; profit?: number };
  last7Days: { orders: number; revenue?: number; profit?: number };
  toConfirm: number;
  inProgress: number;
  dueForDelivery: DueOrder[];
  lowStock: { productId: string; name: string; variantName: string; sku: string; stock: number }[];
}

export interface AdminOrderRow {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  customerName: string;
  phone: string;
  zone: string;
  total: number;
  itemCount: number;
  createdAt: string;
  expectedDeliveryDate: string;
}

export interface AdminOrder {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  expectedDeliveryDate: string;
  deliveredAt: string | null;
  contact: { name: string; email: string; phone: string };
  shippingAddress: { line1: string; area?: string; city: string; postcode?: string; zone: string; zoneLabel: string };
  customerNote: string;
  account: { name: string; email: string } | null;
  courier: { name: string; trackingNumber: string } | null;
  items: {
    productId: string;
    variantSku: string;
    name: string;
    variantName: string;
    image: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    unitCost?: number;
  }[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  totalCost?: number;
  profit?: number;
  statusHistory: { status: OrderStatus; note: string; at: string; by: string | null }[];
  nextStatuses: OrderStatus[];
}

export interface StatusUpdateInput {
  status: OrderStatus;
  note?: string;
  courier?: { name: string; trackingNumber?: string };
  expectedDeliveryDate?: string;
}

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'active' | 'archived';
  image: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  salesCount: number;
  lowStock: boolean;
  variants: { sku: string; name: string; price: number; stock: number; costPrice?: number }[];
  updatedAt: string;
}

export interface VariantForm {
  sku: string;
  name: string;
  options: { color?: string; wattage?: number | ''; capacity?: number | ''; ports?: number | ''; length?: number | '' };
  price: number | '';
  compareAtPrice: number | '' | null;
  costPrice?: number | '';
  stock: number | '';
  image: string;
}

export interface ProductForm {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryIds: string[];
  images: { url: string; alt: string }[];
  highlights: string[];
  specs: { label: string; value: string }[];
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  isFeatured: boolean;
  variants: VariantForm[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface UploadSignature {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}
