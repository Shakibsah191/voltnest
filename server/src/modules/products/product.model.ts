import { Schema, model, Types, type InferSchemaType } from 'mongoose';

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;

/**
 * One sellable version of a product (colour, wattage, length…).
 * costPrice is private: the products service strips it from every public query.
 */
const variantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true }, // e.g. "Black / 2 m"
    options: {
      color: { type: String, trim: true },
      wattage: { type: Number, min: 0 }, // W
      capacity: { type: Number, min: 0 }, // mAh
      ports: { type: Number, min: 0 },
      length: { type: Number, min: 0 }, // metres
    },
    price: { type: Number, required: true, min: 0 }, // BDT
    compareAtPrice: { type: Number, min: 0 }, // BDT, the "was" price
    costPrice: { type: Number, required: true, min: 0 }, // BDT, never public
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String }, // optional variant-specific image
  },
  { _id: true },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, default: 'VoltNest' },
    shortDescription: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    categoryIds: [{ type: Types.ObjectId, ref: 'Category', required: true }],
    images: {
      type: [{ url: { type: String, required: true }, alt: { type: String, default: '' } }],
      default: [],
    },
    highlights: { type: [String], default: [] },
    specs: { type: [{ label: String, value: String }], default: [] },
    variants: {
      type: [variantSchema],
      validate: { validator: (v: unknown[]) => v.length > 0, message: 'A product needs at least one variant' },
    },
    tags: { type: [String], default: [] },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active' },
    isFeatured: { type: Boolean, default: false },

    // denormalised for fast sorting and filtering — kept in sync by the pre-save hook
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },

    // updated by orders and reviews
    salesCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },

    publishedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

productSchema.pre('save', function syncDerivedFields(next) {
  const prices = this.variants.map((v) => v.price);
  this.minPrice = prices.length ? Math.min(...prices) : 0;
  this.maxPrice = prices.length ? Math.max(...prices) : 0;
  this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  next();
});

productSchema.index({ status: 1, categoryIds: 1 });
productSchema.index({ status: 1, publishedAt: -1 });
productSchema.index({ status: 1, salesCount: -1 });
productSchema.index({ status: 1, minPrice: 1 });
productSchema.index({ 'variants.sku': 1 }, { unique: true });
// collection filters (Day 2)
productSchema.index({ status: 1, 'variants.options.wattage': 1 });
productSchema.index({ status: 1, 'variants.options.capacity': 1 });
productSchema.index({ status: 1, 'variants.options.ports': 1 });
productSchema.index({ status: 1, 'variants.price': 1 });

export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel = model('Product', productSchema);
