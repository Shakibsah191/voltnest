import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    image: { type: String, default: '' },
    parent: { type: Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, sortOrder: 1 });

export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model('Category', categorySchema);
