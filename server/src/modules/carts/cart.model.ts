import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const cartItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true, uppercase: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

/**
 * A cart belongs to a logged-in user OR to a guest (identified by a cookie id).
 * Guest carts expire automatically; on login the guest cart merges into the user cart (Day 3).
 */
const cartSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User' },
    guestId: { type: String },
    items: { type: [cartItemSchema], default: [] },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Cart = InferSchemaType<typeof cartSchema>;
export const CartModel = model('Cart', cartSchema);
