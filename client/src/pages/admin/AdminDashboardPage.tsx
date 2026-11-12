import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useDashboard, useIsOwner } from '@/features/admin/hooks';
import { AdminPageHeader, Panel } from '@/features/admin/components/AdminPageHeader';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn, formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const dayShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });

function Stat({ label, value, hint, to, highlight }: { label: string; value: string | number; hint?: string; to?: string; highlight?: boolean }) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold tabular-nums', highlight && 'text-brand')}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </>
  );
  const cls = 'block rounded-card border border-line bg-white p-5';
  return to ? (
    <Link to={to} className={cn(cls, 'transition-colors hover:border-ink-subtle')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');
  const isOwner = useIsOwner();
  const { data, isPending, isError, refetch } = useDashboard();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">The dashboard didn’t load</p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="Today in Bangladesh time. Updates every minute." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Waiting to be confirmed" value={data.toConfirm} hint="Call these customers first" to="/admin/orders?status=pending" highlight={data.toConfirm > 0} />
        <Stat label="Orders today" value={data.today.orders} hint={`${data.last7Days.orders} in the last 7 days`} />
        {isOwner ? (
          <>
            <Stat label="Order value today" value={formatBDT(data.today.revenue ?? 0)} hint={`${formatBDT(data.last7Days.revenue ?? 0)} in 7 days`} />
            <Stat label="Product profit today" value={formatBDT(data.today.profit ?? 0)} hint={`${formatBDT(data.last7Days.profit ?? 0)} in 7 days`} />
          </>
        ) : (
          <Stat label="Being delivered" value={data.inProgress} hint="Confirmed, packing or on the way" />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Due for delivery in the next 3 days">
          {data.dueForDelivery.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing due. All open orders have later delivery dates.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {data.dueForDelivery.map((o) => (
                <li key={o.orderNumber}>
                  <Link to={`/admin/orders/${o.orderNumber}`} className="flex items-center gap-3 rounded-md px-2 py-3 text-sm hover:bg-surface-muted">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums">{o.orderNumber}</span>
                        <OrderStatusBadge status={o.status} />
                        {o.late && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sale">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                            Late
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-ink-muted">
                        {o.customerName}, {o.phone}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-medium">{dayShort.format(new Date(o.expectedDeliveryDate))}</span>
                      <span className="block text-ink-muted tabular-nums">{formatBDT(o.total)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Low stock" actions={<Link to="/admin/products?lowStock=true" className="text-sm font-medium text-brand hover:underline">See all</Link>}>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-ink-muted">Every product has more than 5 in stock.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {data.lowStock.map((v) => (
                <li key={v.sku}>
                  <Link to={`/admin/products/${v.productId}`} className="flex items-center justify-between gap-3 hover:text-brand">
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-medium">{v.name}</span>
                      <span className="text-xs text-ink-muted">{v.variantName}</span>
                    </span>
                    <span className={cn('shrink-0 font-semibold tabular-nums', v.stock === 0 ? 'text-sale' : 'text-warning')}>
                      {v.stock === 0 ? 'Sold out' : `${v.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
