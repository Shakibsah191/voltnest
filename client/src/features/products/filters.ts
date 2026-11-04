import type { ProductSort } from './types';

/** Everything a collection page can be filtered by. All of it lives in the URL. */
export interface CollectionFilters {
  sort: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  wattage: number[];
  capacity: number[];
  ports: number[];
  inStock: boolean;
}

export const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'rating', label: 'Top rated' },
];

const SORT_VALUES = new Set<string>(SORTS.map((s) => s.value));

const numList = (v: string | null) =>
  (v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);

const num = (v: string | null) => {
  if (v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function parseFilters(params: URLSearchParams): CollectionFilters {
  const sort = params.get('sort');
  return {
    sort: sort && SORT_VALUES.has(sort) ? (sort as ProductSort) : 'newest',
    minPrice: num(params.get('minPrice')),
    maxPrice: num(params.get('maxPrice')),
    wattage: numList(params.get('wattage')),
    capacity: numList(params.get('capacity')),
    ports: numList(params.get('ports')),
    inStock: params.get('inStock') === 'true',
  };
}

/** Back to URL params. Defaults are left out so URLs stay short and shareable. */
export function filtersToParams(f: CollectionFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.sort !== 'newest') p.set('sort', f.sort);
  if (f.minPrice !== undefined) p.set('minPrice', String(f.minPrice));
  if (f.maxPrice !== undefined) p.set('maxPrice', String(f.maxPrice));
  if (f.wattage.length) p.set('wattage', [...f.wattage].sort((a, b) => a - b).join(','));
  if (f.capacity.length) p.set('capacity', [...f.capacity].sort((a, b) => a - b).join(','));
  if (f.ports.length) p.set('ports', [...f.ports].sort((a, b) => a - b).join(','));
  if (f.inStock) p.set('inStock', 'true');
  return p;
}

/** Params for the API call (same names the server expects). */
export function filtersToApiParams(f: CollectionFilters) {
  return {
    sort: f.sort,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    wattage: f.wattage.join(',') || undefined,
    capacity: f.capacity.join(',') || undefined,
    ports: f.ports.join(',') || undefined,
    inStock: f.inStock || undefined,
  };
}

export const countActiveFilters = (f: CollectionFilters) =>
  (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0) +
  f.wattage.length +
  f.capacity.length +
  f.ports.length +
  (f.inStock ? 1 : 0);

export const formatWattage = (w: number) => `${w}W`;
export const formatCapacity = (c: number) => `${c.toLocaleString('en-US')} mAh`;
export const formatPorts = (p: number) => (p === 1 ? '1 port' : `${p} ports`);

export const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under ৳1,000', max: 1000 },
  { label: '৳1,000 to ৳3,000', min: 1000, max: 3000 },
  { label: '৳3,000 to ৳6,000', min: 3000, max: 6000 },
  { label: 'Over ৳6,000', min: 6000 },
];
