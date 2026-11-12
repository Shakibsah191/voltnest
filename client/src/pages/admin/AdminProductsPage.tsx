import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAdminProducts, useIsOwner } from '@/features/admin/hooks';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/shared/ui/Badge';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn, formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const STATUS_TONE = { active: 'success', draft: 'warning', archived: 'neutral' } as const;
const STATUS_TEXT = { active: 'On sale', draft: 'Draft', archived: 'Hidden' } as const;

export function AdminProductsPage() {
  useDocumentTitle('Products');
  const isOwner = useIsOwner();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const lowStock = params.get('lowStock') === 'true';
  const page = Number(params.get('page') ?? 1);
  const [search, setSearch] = useState(q);
  const { data, isPending, isError, refetch, isPlaceholderData } = useAdminProducts({
    q: q || undefined,
    status: status || undefined,
    lowStock: lowStock ? 'true' : undefined,
    page,
    limit: 25,
  });

  const update = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) v ? p.set(k, v) : p.delete(k);
    if (!('page' in next)) p.delete('page');
    setParams(p, { replace: true });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    update({ q: search.trim() });
  };

  return (
    <>
      <AdminPageHeader
        title="Products"
        subtitle={isOwner ? 'Add products, change prices and photos, and keep stock right.' : 'Open a product to update its stock.'}
        actions={
          isOwner && (
            <Link to="/admin/products/new" className={buttonClasses('primary', 'md')}>
              <Plus className="h-4 w-4" aria-hidden />
              Add product
            </Link>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form onSubmit={submit} role="search" className="relative min-w-[16rem] flex-1">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => search.trim() !== q && update({ q: search.trim() })}
            placeholder="Name or SKU"
            className="h-11 w-full rounded-pill border border-line bg-white pl-9 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </form>
        <label className="sr-only" htmlFor="product-status">
          Status
        </label>
        <select id="product-status" value={status} onChange={(e) => update({ status: e.target.value })} className="h-11 rounded-pill border border-line bg-white px-4 text-sm">
          <option value="">All statuses</option>
          <option value="active">On sale</option>
          <option value="draft">Draft</option>
          <option value="archived">Hidden</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStock} onChange={(e) => update({ lowStock: e.target.checked ? 'true' : '' })} className="h-4 w-4 accent-brand" />
          Low stock only
        </label>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="font-semibold">Products didn’t load</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.data.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white py-14 text-center">
          <p className="font-semibold">No products match</p>
          <p className="mt-1 text-sm text-ink-muted">Try another search or filter.</p>
        </div>
      ) : (
        <>
          <ul className={cn('space-y-2', isPlaceholderData && 'opacity-60')}>
            {data.data.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/products/${p.id}`} className="flex items-center gap-4 rounded-card border border-line bg-white p-3 transition-colors hover:border-ink-subtle sm:p-4">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-1 font-medium">{p.name}</span>
                      <Badge tone={STATUS_TONE[p.status]}>{STATUS_TEXT[p.status]}</Badge>
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {p.variants.map((v) => (
                        <span
                          key={v.sku}
                          className={cn(
                            'rounded-pill px-2 py-0.5 text-xs tabular-nums',
                            v.stock === 0 ? 'bg-sale/10 text-sale' : v.stock <= 5 ? 'bg-warning/10 text-warning' : 'bg-surface-muted text-ink-muted',
                          )}
                        >
                          {v.name}: {v.stock}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-sm sm:block">
                    <span className="block font-medium tabular-nums">
                      {p.minPrice === p.maxPrice ? formatBDT(p.minPrice) : `${formatBDT(p.minPrice)} – ${formatBDT(p.maxPrice)}`}
                    </span>
                    <span className="block text-xs text-ink-muted">{p.salesCount} sold</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {data.meta && data.meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                Previous
              </Button>
              <span className="text-ink-muted">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= data.meta.totalPages} onClick={() => update({ page: String(page + 1) })}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
