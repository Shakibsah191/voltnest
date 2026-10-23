import { Schema, model, Types, type InferSchemaType } from 'mongoose';
import { DELIVERY_ZONES } from '../users/user.model';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;
export const PAYMENT_METHODS = ['cod', 'sslcommerz'] as const;
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refunded'] as const;

/** Snapshot of what was bought, frozen at order time (prices can change later). */
const orderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true },
    name: { type: String, required: true },
    variantName: { type: String, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // BDT the customer paid
    unitCost: { type: Number, required: true, min: 0 }, // BDT it cost us (for profit reports)
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const statusEventSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: '' },
    changedBy: { type: Types.ObjectId, ref: 'User' },
    at: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // e.g. VN-260423-4821
    user: { type: Types.ObjectId, ref: 'User', default: null }, // null for guest orders
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    shippingAddress: {
      line1: { type: String, required: true, trim: true },
      area: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      postcode: { type: String, trim: true },
      zone: { type: String, enum: DELIVERY_ZONES, required: true },
    },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v: unknown[]) => v.length > 0, message: 'An order needs at least one item' },
    },

    // all money in BDT, always calculated by the server
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },

    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: { type: [statusEventSchema], default: [] },

    expectedDeliveryDate: { type: Date, required: true },
    deliveredAt: { type: Date },
    courier: {
      name: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
    },
    customerNote: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ expectedDeliveryDate: 1, status: 1 });

export type Order = InferSchemaType<typeof orderSchema>;
export const OrderModel = model('Order', orderSchema);
