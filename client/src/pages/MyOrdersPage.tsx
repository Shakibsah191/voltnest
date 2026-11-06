import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { useMyOrders } from '@/features/orders/hooks';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { shortDate } from '@/features/orders/status';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function MyOrdersPage() {
  useDocumentTitle('My orders');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch, isPlaceholderData } = useMyOrders(page, 10);

  return (
    <div className="container max-w-3xl py-6 lg:py-10">
      <Breadcrumbs items={[{ label: 'My account', to: '/account' }, { label: 'My orders' }]} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">My orders</h1>

      {isPending ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-10 text-center">
          <p className="font-semibold">Your orders didn’t load</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.data.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-card border border-dashed border-line px-6 py-14 text-center">
          <Package className="h-8 w-8 text-ink-muted" aria-hidden />
          <p className="mt-4 text-lg font-semibold">No orders yet</p>
          <p className="mt-1 text-sm text-ink-muted">Orders you place while logged in show up here.</p>
          <Link to="/collections/all" className={buttonClasses('primary', 'md', 'mt-6')}>
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className={`mt-6 space-y-3 ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.data.map((o) => (
              <li key={o.orderNumber}>
                <Link
                  to={`/account/orders/${o.orderNumber}`}
                  className="flex items-center gap-4 rounded-card border border-line bg-white p-4 transition-colors hover:border-ink-subtle"
                >
                  <span className="flex shrink-0 -space-x-3">
                    {o.images.map((src, i) => (
                      <span key={i} className="h-12 w-12 overflow-hidden rounded-md border-2 border-white bg-surface-muted">
                        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                      </span>
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums">{o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">
                      {shortDate.format(new Date(o.createdAt))}, {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}, {formatBDT(o.total)}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {data.meta && data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Newer
              </Button>
              <span className="text-sm text-ink-muted">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Older
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
