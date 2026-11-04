import { z } from 'zod';
import type { FilterQuery, PipelineStage, SortOrder } from 'mongoose';
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

type SortKey = keyof typeof SORT_OPTIONS;

/** "20,65,100" → [20, 65, 100]; ignores junk values. */
const numberList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) =>
    (Array.isArray(v) ? v.join(',') : v ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== '')
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 20),
  );

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.coerce.number().min(0).optional(),
);

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  sort: z.enum(Object.keys(SORT_OPTIONS) as [SortKey, ...SortKey[]]).default('newest'),
  q: z.string().trim().max(80).optional(),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  wattage: numberList,
  capacity: numberList,
  ports: numberList,
  inStock: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

const ACTIVE: FilterQuery<Product> = { status: 'active' };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turns the URL filters into one MongoDB filter.
 * Variant-level filters use $elemMatch so they must all be true for the SAME variant
 * (e.g. "65W AND in stock" means one variant that is 65W and has stock).
 */
export function buildFilter(base: FilterQuery<Product>, query: ListQuery): FilterQuery<Product> {
  const filter: FilterQuery<Product> = { ...ACTIVE, ...base };

  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: 'i' };
    filter.$or = [{ name: rx }, { tags: rx }, { shortDescription: rx }];
  }

  let { minPrice, maxPrice } = query;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const variant: Record<string, unknown> = {};
  if (minPrice !== undefined || maxPrice !== undefined) {
    variant.price = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }
  if (query.wattage.length) variant['options.wattage'] = { $in: query.wattage };
  if (query.capacity.length) variant['options.capacity'] = { $in: query.capacity };
  if (query.ports.length) variant['options.ports'] = { $in: query.ports };
  if (query.inStock) variant.stock = { $gt: 0 };

  if (Object.keys(variant).length) filter.variants = { $elemMatch: variant };
  return filter;
}

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

export interface FacetValue {
  value: number;
  count: number;
}
export interface Facets {
  price: { min: number; max: number };
  wattage: FacetValue[];
  capacity: FacetValue[];
  ports: FacetValue[];
}

/** Which filter values exist in this set of products, and how many products have each. */
async function getFacets(base: FilterQuery<Product>): Promise<Facets> {
  const optionFacet = (field: 'wattage' | 'capacity' | 'ports'): PipelineStage.FacetPipelineStage[] => [
    { $unwind: '$variants' },
    { $match: { [`variants.options.${field}`]: { $gt: 0 } } },
    { $group: { _id: `$variants.options.${field}`, products: { $addToSet: '$_id' } } },
    { $project: { _id: 0, value: '$_id', count: { $size: '$products' } } },
    { $sort: { value: 1 } },
  ];

  const [result] = await ProductModel.aggregate<{
    price: { min: number; max: number }[];
    wattage: FacetValue[];
    capacity: FacetValue[];
    ports: FacetValue[];
  }>([
    { $match: { ...ACTIVE, ...base } },
    {
      $facet: {
        price: [{ $group: { _id: null, min: { $min: '$minPrice' }, max: { $max: '$maxPrice' } } }],
        wattage: optionFacet('wattage'),
        capacity: optionFacet('capacity'),
        ports: optionFacet('ports'),
      },
    },
  ]);

  return {
    price: { min: result?.price[0]?.min ?? 0, max: result?.price[0]?.max ?? 0 },
    wattage: result?.wattage ?? [],
    capacity: result?.capacity ?? [],
    ports: result?.ports ?? [],
  };
}

const ALL_PRODUCTS = {
  name: 'All products',
  slug: 'all',
  description: 'Every VoltNest charger, power bank, cable, hub and audio product in one place.',
};

export const productService = {
  /** GET /products — active products with optional search (?q=) and filters, paginated. */
  async list(query: ListQuery) {
    return paginate(buildFilter({}, query), query);
  },

  /**
   * GET /categories/:slug/products — one category (or "all") with filters, sort, pagination
   * and the filter options (facets) that exist in that category.
   */
  async listByCategorySlug(slug: string, query: ListQuery) {
    let category: { name: string; slug: string; description: string } = ALL_PRODUCTS;
    let base: FilterQuery<Product> = {};
    if (slug !== 'all') {
      const found = await categoryService.getBySlug(slug);
      category = found;
      base = { categoryIds: found._id };
    }

    const [result, facets] = await Promise.all([
      paginate(buildFilter(base, query), query),
      query.page === 1 ? getFacets(base) : Promise.resolve(undefined), // facets only needed once
    ]);
    return { category, facets, ...result };
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
