export interface DeliveryZoneOption {
  id: string;
  label: string;
  description: string;
  charge: number;
  minDays: number;
  maxDays: number;
}

export interface PaymentMethodOption {
  id: 'cod' | 'sslcommerz';
  label: string;
  description: string;
  available: boolean;
}

export interface CheckoutOptions {
  zones: DeliveryZoneOption[];
  freeDeliveryThreshold: number;
  paymentMethods: PaymentMethodOption[];
}

/** Sent to POST /orders. No prices: the server works them out from the cart. */
export interface PlaceOrderInput {
  contact: { name: string; email: string; phone: string };
  shippingAddress: { line1: string; area: string; city: string; postcode: string; zone: string };
  paymentMethod: 'cod';
  note: string;
  saveAddress: boolean;
}

export interface OrderConfirmation {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  expectedDeliveryDate: string;
  deliveryZone: { id: string; label: string };
  contact: { name: string; email: string; phone: string };
  items: { name: string; variantName: string; image: string; quantity: number; unitPrice: number; lineTotal: number }[];
  createdAt: string;
}
