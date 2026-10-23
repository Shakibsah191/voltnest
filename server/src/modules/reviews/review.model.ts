import { Schema, model, Types, type InferSchemaType } from 'mongoose';

export const REVIEW_STATUSES = ['published', 'hidden'] as const;

/** Only customers with a delivered order for the product can review it (enforced on Day 4). */
const reviewSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    user: { type: Types.ObjectId, ref: 'User', required: true },
    order: { type: Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    body: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: REVIEW_STATUSES, default: 'published' },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

export type Review = InferSchemaType<typeof reviewSchema>;
export const ReviewModel = model('Review', reviewSchema);
