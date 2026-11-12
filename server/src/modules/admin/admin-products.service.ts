import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import { ProductModel } from '../products/product.model';
import type { ProductInput } from './admin.schemas';

const LOW_STOCK = 5;
const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'product';

/** The product fields the admin screens use (lean query result). */
interface AdminProductLean {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  status: string;
  shortDescription?: string;
  description?: string;
  categoryIds: Types.ObjectId[];
  images: { url: string; alt?: string }[];
  highlights?: string[];
  specs?: { label?: string; value?: string }[];
  tags?: string[];
  isFeatured: boolean;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  salesCount: number;
  updatedAt: Date;
  variants: {
    sku: string;
    name: string;
    options?: Record<string, unknown>;
    price: number;
    compareAtPrice?: number | null;
    costPrice: number; // private: only sent to the owner
    stock: number;
    image?: string | null;
  }[];
}

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = base;
  for (let n = 2; await ProductModel.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }); n++) slug = `${base}-${n}`;
  return slug;
}

/** Turns Mongo's "duplicate key" error into a message the owner understands. */
function duplicateError(err: unknown): never {
  const e = err as { code?: number; keyValue?: Record<string, string> };
  if (e.code === 11000) {
    if (e.keyValue?.['variants.sku']) {
      throw new AppError(409, `SKU ${e.keyValue['variants.sku']} is already used by another product`, 'DUPLICATE_SKU');
    }
    throw new AppError(409, 'That link name (slug) is already used by another product', 'DUPLICATE_SLUG');
  }
  throw err;
}

export const adminProductsService = {
  async list({ page, limit, q, status, lowStock }: { page: number; limit: number; q?: string; status?: string; lowStock?: boolean }, includeCost: boolean) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (lowStock) filter['variants.stock'] = { $lte: LOW_STOCK };
    if (q) {
      const rx = { $regex: escapeRx(q), $options: 'i' };
      filter.$or = [{ name: rx }, { 'variants.sku': { $regex: escapeRx(q.toUpperCase()) } }];
    }
    const [rows, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('name slug status images variants minPrice maxPrice totalStock salesCount updatedAt')
        .lean<AdminProductLean[]>(),
      ProductModel.countDocuments(filter),
    ]);
    return {
      items: rows.map((p) => {
        return {
          id: String(p._id),
          name: p.name,
          slug: p.slug,
          status: p.status,
          image: p.images[0]?.url ?? '',
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          totalStock: p.totalStock,
          salesCount: p.salesCount,
          lowStock: p.variants.some((v) => v.stock <= LOW_STOCK),
          variants: p.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            stock: v.stock,
            ...(includeCost ? { costPrice: v.costPrice } : {}),
          })),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async get(id: string, includeCost: boolean) {
    const p = await ProductModel.findById(id).lean<AdminProductLean>();
    if (!p) throw AppError.notFound('Product not found');
    return {
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription ?? '',
      description: p.description ?? '',
      categoryIds: p.categoryIds.map(String),
      images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? '' })),
      highlights: p.highlights ?? [],
      specs: (p.specs ?? []).map((x) => ({ label: x.label ?? '', value: x.value ?? '' })),
      tags: p.tags ?? [],
      status: p.status,
      isFeatured: p.isFeatured,
      variants: p.variants.map((v) => ({
        sku: v.sku,
        name: v.name,
        options: v.options ?? {},
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
        stock: v.stock,
        image: v.image ?? '',
        ...(includeCost ? { costPrice: v.costPrice } : {}),
      })),
    };
  },

  async create(input: ProductInput) {
    const slug = await uniqueSlug(input.slug || slugify(input.name));
    try {
      const p = await ProductModel.create({ ...input, slug, categoryIds: input.categoryIds.map((c) => new Types.ObjectId(c)) });
      return { id: p.id as string, slug: p.slug };
    } catch (err) {
      duplicateError(err);
    }
  },

  async update(id: string, input: ProductInput) {
    const p = await ProductModel.findById(id);
    if (!p) throw AppError.notFound('Product not found');
    const slug = await uniqueSlug(input.slug || slugify(input.name), id);
    p.set({ ...input, slug, categoryIds: input.categoryIds.map((c) => new Types.ObjectId(c)) });
    try {
      await p.save(); // the pre-save hook recalculates min/max price and total stock
      return { id, slug: p.slug };
    } catch (err) {
      duplicateError(err);
    }
  },

  /** Staff and owner: set the stock count of one or more variants. Nothing else changes. */
  async setStock(id: string, variants: { sku: string; stock: number }[]) {
    const product = await ProductModel.findById(id).select('variants.sku').lean<Pick<AdminProductLean, 'variants'>>();
    if (!product) throw AppError.notFound('Product not found');
    const known = new Set(product.variants.map((v) => v.sku));
    const unknown = variants.find((v) => !known.has(v.sku));
    if (unknown) throw AppError.badRequest(`This product has no variant ${unknown.sku}`);

    for (const v of variants) {
      await ProductModel.updateOne({ _id: id, 'variants.sku': v.sku }, { $set: { 'variants.$.stock': v.stock } });
    }
    // keep the cached total in step with the variants
    await ProductModel.updateOne({ _id: id }, [{ $set: { totalStock: { $sum: '$variants.stock' } } }]);
    const after = await ProductModel.findById(id).select('totalStock variants.sku variants.stock').lean<Pick<AdminProductLean, 'totalStock' | 'variants'>>();
    return { totalStock: after!.totalStock, variants: after!.variants.map((v) => ({ sku: v.sku, stock: v.stock })) };
  },
};
