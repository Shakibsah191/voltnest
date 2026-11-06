import type { OrderStatus } from './types';

/** Words a customer understands, instead of the database values. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Packing',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const STATUS_TONE: Record<OrderStatus, 'neutral' | 'new' | 'success' | 'sale' | 'warning'> = {
  pending: 'warning',
  confirmed: 'new',
  processing: 'new',
  shipped: 'new',
  delivered: 'success',
  cancelled: 'sale',
  returned: 'neutral',
};

export const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Dhaka',
});

export const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' });
export const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
