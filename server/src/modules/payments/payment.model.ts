import { Schema, model, Types, type InferSchemaType } from 'mongoose';

export const PAYMENT_PROVIDERS = ['sslcommerz', 'cod'] as const;
export const PAYMENT_RECORD_STATUSES = ['initiated', 'validated', 'failed', 'cancelled'] as const;

/** One payment attempt. An order can have several (e.g. a failed try, then a success). */
const paymentSchema = new Schema(
  {
    order: { type: Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true },
    provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
    tranId: { type: String, required: true, unique: true }, // our transaction id sent to SSLCommerz
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: 'initiated' },
    valId: { type: String }, // from SSLCommerz, used with the validation API
    bankTranId: { type: String },
    cardType: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed }, // raw IPN / validation payload for audits
    validatedAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ order: 1, createdAt: -1 });

export type Payment = InferSchemaType<typeof paymentSchema>;
export const PaymentModel = model('Payment', paymentSchema);
