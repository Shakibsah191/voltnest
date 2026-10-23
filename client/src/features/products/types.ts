export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface VariantOptions {
  color?: string;
  wattage?: number;
  capacity?: number;
  ports?: number;
  length?: number;
}

/** Note: costPrice is never sent by the public API. */
export interface Variant {
  _id: string;
  sku: string;
  name: string;
  options: VariantOptions;
  price: number;
  compareAtPrice?: number;
  stock: number;
  image?: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}

/** The lighter shape used on cards and grids. */
export interface ProductSummary {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string;
  categoryIds: string[];
  images: ProductImage[];
  variants: Variant[];
  tags: string[];
  isFeatured: boolean;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  salesCount: number;
  ratingAvg: number;
  ratingCount: number;
  publishedAt: string;
}

export interface Product extends Omit<ProductSummary, 'categoryIds'> {
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  categoryIds: Pick<Category, '_id' | 'name' | 'slug'>[];
}

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'bestselling' | 'rating';

export interface ProductListParams {
  page?: number;
  limit?: number;
  sort?: ProductSort;
}

export interface HomeData {
  categories: Category[];
  newArrivals: ProductSummary[];
  bestsellers: ProductSummary[];
  featured: ProductSummary[];
}

export interface ProductDetailData {
  product: Product;
  related: ProductSummary[];
}
