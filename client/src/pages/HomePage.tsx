import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { productsApi } from '@/features/products/api';
import { productKeys } from '@/features/products/hooks';
import type { ProductSort } from '@/features/products/types';
import { Button } from '@/shared/ui/Button';
import { ProductCard } from '@/shared/ui/ProductCard';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';

const PAGE_SIZE = 12;

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
];

/**
 * Day 1 home: proves the API → React Query → UI pipeline end to end.
 * Day 2 replaces the top of this page with the hero, category rail and shelves.
 */
export function HomePage() {
  const [sort, setSort] = useState<ProductSort>('newest');

  const query = useInfiniteQuery({
    queryKey: [...productKeys.all, 'infinite', sort],
    queryFn: ({ pageParam, signal }) => productsApi.list({ page: pageParam, limit: PAGE_SIZE, sort }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });

  const products = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta?.total ?? 0;

  return (
    <div className="container py-10 lg:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold lg:text-4xl">Charge everything you carry</h1>
          <p className="mt-2 max-w-prose text-ink-muted">
            {query.isSuccess ? `${total} products, ` : ''}from 20W phone chargers to 26,800 mAh laptop power banks.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ProductSort)}
            className="h-10 rounded-pill border border-line bg-white px-4 pr-8 text-sm font-medium focus:border-brand focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {query.isError ? (
        <div role="alert" className="mt-10 rounded-card border border-line bg-surface-muted p-8 text-center">
          <h2 className="text-lg font-semibold">Products didn’t load</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{query.error.message}</p>
          <Button className="mt-5" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {query.isPending
              ? Array.from({ length: 8 }, (_, i) => (
                  <li key={i}>
                    <ProductCardSkeleton />
                  </li>
                ))
              : products.map((p) => (
                  <li key={p._id}>
                    <ProductCard product={p} />
                  </li>
                ))}
          </ul>

          {query.isSuccess && products.length === 0 && (
            <p className="mt-10 text-center text-ink-muted">
              No products yet. Run <code className="rounded bg-surface-sunken px-1.5 py-0.5">npm run seed</code> in the
              server folder.
            </p>
          )}

          {query.hasNextPage && (
            <div className="mt-12 flex flex-col items-center gap-3">
              <p className="text-sm text-ink-muted">
                Showing {products.length} of {total}
              </p>
              <Button variant="outline" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
