import { z } from 'zod';
import type { FilterQuery, SortOrder } from 'mongoose';
import { ProductModel, type Product } from './product.model';
import { categoryService } from '../categories/category.service';
import { AppError } from '../../shared/errors/AppError';
import type { PageMeta } from '../../shared/http';

/**
 * costPrice must NEVER leave the server through a public endpoint.
 * Every public query in this file uses one of these projections.
 */
const PUBLIC_DETAIL_PROJECTION = '-variants.costPrice -__v';
const PUBLIC_CARD_PROJECTION = '-variants.costPrice -description -specs -highlights -__v';

export const SORT_OPTIONS = {
  newest: { publishedAt: -1 },
  'price-asc': { minPrice: 1 },
  'price-desc': { minPrice: -1 },
  bestselling: { salesCount: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
} satisfies Record<string, Record<string, SortOrder>>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  sort: z.enum(Object.keys(SORT_OPTIONS) as [keyof typeof SORT_OPTIONS, ...(keyof typeof SORT_OPTIONS)[]]).default('newest'),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

const ACTIVE: FilterQuery<Product> = { status: 'active' };

async function paginate(filter: FilterQuery<Product>, { page, limit, sort }: ListQuery) {
  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .select(PUBLIC_CARD_PROJECTION)
      .sort({ ...SORT_OPTIONS[sort], _id: 1 }) // _id keeps paging stable when sort values tie
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);
  const meta: PageMeta = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  return { items, meta };
}

export const productService = {
  /** GET /products — all active products, paginated. */
  async list(query: ListQuery) {
    return paginate(ACTIVE, query);
  },

  /** GET /categories/:slug/products — Day 2 adds price/wattage/capacity/port filters here. */
  async listByCategorySlug(slug: string, query: ListQuery) {
    const category = await categoryService.getBySlug(slug);
    const result = await paginate({ ...ACTIVE, categoryIds: category._id }, query);
    return { category, ...result };
  },

  /** GET /home — everything the home page needs in one request. */
  async getHome() {
    const shelf = (sort: Record<string, SortOrder>, extra: FilterQuery<Product> = {}) =>
      ProductModel.find({ ...ACTIVE, ...extra }).select(PUBLIC_CARD_PROJECTION).sort(sort).limit(8).lean();

    const [categories, newArrivals, bestsellers, featured] = await Promise.all([
      categoryService.listActive(),
      shelf({ publishedAt: -1 }),
      shelf({ salesCount: -1 }),
      shelf({ salesCount: -1 }, { isFeatured: true }),
    ]);
    return { categories, newArrivals, bestsellers, featured };
  },

  /** GET /products/:slug — full product plus up to 4 related products from the same category. */
  async getBySlug(slug: string) {
    const product = await ProductModel.findOne({ ...ACTIVE, slug: slug.toLowerCase() })
      .select(PUBLIC_DETAIL_PROJECTION)
      .populate('categoryIds', 'name slug')
      .lean();
    if (!product) throw AppError.notFound(`Product "${slug}" not found`);

    const related = await ProductModel.find({
      ...ACTIVE,
      _id: { $ne: product._id },
      categoryIds: { $in: product.categoryIds.map((c) => c._id) },
    })
      .select(PUBLIC_CARD_PROJECTION)
      .sort({ salesCount: -1 })
      .limit(4)
      .lean();

    return { product, related };
  },
};
