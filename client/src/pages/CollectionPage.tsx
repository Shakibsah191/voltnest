import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useCollection } from '@/features/products/hooks';
import { countActiveFilters, filtersToApiParams, filtersToParams, parseFilters, type CollectionFilters } from '@/features/products/filters';
import { FilterPanel } from '@/features/products/components/FilterPanel';
import { ActiveFilters } from '@/features/products/components/ActiveFilters';
import { SortSelect } from '@/features/products/components/SortSelect';
import { LoadMore, ProductGrid } from '@/features/products/components/ProductGrid';
import { ApiError } from '@/shared/api-client';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { cn } from '@/shared/lib/utils';
import { NotFoundPage } from './NotFoundPage';

export function CollectionPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const filters = useMemo(() => parseFilters(params), [params]);
  const apiParams = useMemo(() => filtersToApiParams(filters), [filters]);
  const query = useCollection(slug, apiParams);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const first = query.data?.pages[0];
  const category = first?.data.category;
  const facets = first?.data.facets;
  const total = first?.meta?.total ?? 0;
  const products = query.data?.pages.flatMap((p) => p.data.items) ?? [];
  const activeCount = countActiveFilters(filters);

  useDocumentTitle(category?.name);

  // keep commas readable in shared links: ?wattage=65,100 instead of ?wattage=65%2C100
  const update = (next: CollectionFilters) => {
    const search = filtersToParams(next).toString().replace(/%2C/gi, ',');
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
  };

  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;

  const panel = <FilterPanel filters={filters} facets={facets} onChange={update} />;

  return (
    <div className="container py-8 lg:py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: category?.name ?? '…' }]} />

      <header className="mt-4 max-w-2xl">
        {category ? (
          <>
            <h1 className="text-3xl font-bold lg:text-4xl">{category.name}</h1>
            <p className="mt-2 text-ink-muted">{category.description}</p>
          </>
        ) : (
          <>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="mt-3 h-5 w-96 max-w-full" />
          </>
        )}
      </header>

      <div className="mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-[calc(theme(spacing.header)+1.5rem)]">{panel}</div>
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters{activeCount > 0 && ` (${activeCount})`}
            </Button>
            <p className="hidden text-sm text-ink-muted lg:block" aria-live="polite">
              {query.isSuccess && `${total} ${total === 1 ? 'product' : 'products'}`}
            </p>
            <SortSelect value={filters.sort} onChange={(sort) => update({ ...filters, sort })} />
          </div>

          {activeCount > 0 && (
            <div className="mt-4">
              <ActiveFilters filters={filters} onChange={update} />
            </div>
          )}

          {query.isError ? (
            <div role="alert" className="mt-8 rounded-card border border-line bg-surface-muted p-8 text-center">
              <h2 className="text-lg font-semibold">Products didn’t load</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{query.error.message}</p>
              <Button className="mt-5" onClick={() => query.refetch()}>
                Try again
              </Button>
            </div>
          ) : query.isSuccess && products.length === 0 ? (
            <div className="mt-8 rounded-card bg-surface-muted px-6 py-14 text-center">
              <h2 className="text-lg font-semibold">No products match these filters</h2>
              <p className="mt-2 text-sm text-ink-muted">Try removing a filter or two.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={() => update({ ...filters, wattage: [], capacity: [], ports: [], inStock: false, minPrice: undefined, maxPrice: undefined })}>
                  Clear filters
                </Button>
                <Link to="/collections/all" className={buttonClasses('ghost')}>
                  Shop all products
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-ink-muted lg:hidden" aria-live="polite">
                {query.isSuccess && `${total} ${total === 1 ? 'product' : 'products'}`}
              </p>
              <ProductGrid
                products={products}
                loading={query.isPending}
                columns="narrow"
                className={cn('mt-6 transition-opacity', query.isPlaceholderData && 'opacity-50')}
              />
              <LoadMore
                shown={products.length}
                total={total}
                hasMore={Boolean(query.hasNextPage)}
                loading={query.isFetchingNextPage}
                onLoadMore={() => query.fetchNextPage()}
              />
            </>
          )}
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="left"
        title="Filters"
        footer={
          <Button fullWidth onClick={() => setFiltersOpen(false)}>
            Show {total} {total === 1 ? 'product' : 'products'}
          </Button>
        }
      >
        <div className="p-5">{panel}</div>
      </Drawer>
    </div>
  );
}
