import { Link, useSearchParams } from 'react-router-dom';
import { useSearch, useCategories } from '@/features/products/hooks';
import { LoadMore, ProductGrid } from '@/features/products/components/ProductGrid';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const query = useSearch(q);
  const { data: categories = [] } = useCategories();
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  const products = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta?.total ?? 0;

  return (
    <div className="container py-8 lg:py-10">
      <h1 className="text-3xl font-bold">{q ? <>Results for “{q}”</> : 'Search'}</h1>
      {query.isSuccess && (
        <p className="mt-2 text-ink-muted" aria-live="polite">
          {total} {total === 1 ? 'product' : 'products'}
        </p>
      )}

      {!q ? (
        <p className="mt-6 text-ink-muted">Type in the search box above to find a product.</p>
      ) : query.isError ? (
        <p role="alert" className="mt-6 text-sale">{query.error.message}</p>
      ) : query.isSuccess && total === 0 ? (
        <div className="mt-8 rounded-card bg-surface-muted p-8">
          <p className="font-semibold">Nothing matched “{q}”.</p>
          <p className="mt-1 text-sm text-ink-muted">Check the spelling, try a shorter word, or browse a category:</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c._id}>
                <Link to={`/collections/${c.slug}`} className="inline-flex rounded-pill border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ProductGrid products={products} loading={query.isPending} className="mt-8" />
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
  );
}
