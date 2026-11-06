import type { OrderConfirmation } from '@/features/checkout/types';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface OrderSummary {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  images: string[];
  createdAt: string;
  expectedDeliveryDate: string;
  deliveredAt: string | null;
}

export interface OrderDetail extends Omit<OrderConfirmation, 'items' | 'status'> {
  status: OrderStatus;
  customerNote: string;
  deliveredAt: string | null;
  courier: { name: string; trackingNumber: string } | null;
  statusHistory: { status: OrderStatus; note: string; at: string }[];
  items: (OrderConfirmation['items'][number] & {
    productId: string;
    productSlug: string | null;
    variantSku: string;
    reviewed: boolean;
  })[];
  canReview: boolean;
}
