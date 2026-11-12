import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAdminOrders } from '@/features/admin/hooks';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn, formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'To confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Packing' },
  { value: 'shipped', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const placed = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' });
const due = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });

export function AdminOrdersPage() {
  useDocumentTitle('Orders');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [search, setSearch] = useState(q);

  const { data, isPending, isError, refetch, isPlaceholderData } = useAdminOrders({ status: status || undefined, q: q || undefined, from: from || undefined, to: to || undefined, page, limit: 20 });

  const update = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) v ? p.set(k, v) : p.delete(k);
    if (!('page' in next)) p.delete('page');
    setParams(p, { replace: true });
  };
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ q: search.trim() });
  };

  const rows = data?.data ?? [];

  return (
    <>
      <AdminPageHeader title="Orders" subtitle="New orders show up here on their own every minute." />

      <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={status === t.value}
            onClick={() => update({ status: t.value })}
            className={cn(
              'shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
              status === t.value ? 'bg-ink text-white' : 'bg-white text-ink-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <form onSubmit={submitSearch} className="relative min-w-[16rem] flex-1" role="search">
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            id="order-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => search.trim() !== q && update({ q: search.trim() })}
            placeholder="Order number, phone or name"
            className="h-11 w-full rounded-pill border border-line bg-white pl-9 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </form>
        <label className="text-xs text-ink-muted">
          From
          <input type="date" value={from} onChange={(e) => update({ from: e.target.value })} className="mt-1 block h-11 rounded-md border border-line bg-white px-3 text-sm text-ink" />
        </label>
        <label className="text-xs text-ink-muted">
          To
          <input type="date" value={to} onChange={(e) => update({ to: e.target.value })} className="mt-1 block h-11 rounded-md border border-line bg-white px-3 text-sm text-ink" />
        </label>
        {(q || from || to) && (
          <Button variant="ghost" size="sm" onClick={() => (setSearch(''), update({ q: '', from: '', to: '' }))}>
            Clear
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="font-semibold">Orders didn’t load</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white py-14 text-center">
          <p className="font-semibold">No orders here</p>
          <p className="mt-1 text-sm text-ink-muted">{q || from || to || status ? 'Try another filter.' : 'Orders appear as soon as customers place them.'}</p>
        </div>
      ) : (
        <div className={cn('overflow-hidden rounded-card border border-line bg-white', isPlaceholderData && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-surface-muted text-left text-xs text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((o) => (
                  <tr key={o.orderNumber} className="hover:bg-surface-muted/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.orderNumber}`} className="font-semibold tabular-nums text-brand hover:underline">
                        {o.orderNumber}
                      </Link>
                      <span className="block text-xs text-ink-muted">{placed.format(new Date(o.createdAt))}</span>
                    </td>
                    <td className="px-4 py-3">
                      {o.customerName}
                      <span className="block text-xs text-ink-muted tabular-nums">{o.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{o.zone}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{due.format(new Date(o.expectedDeliveryDate))}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatBDT(o.total)}
                      <span className="block text-xs font-normal text-ink-muted">
                        {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                Newer
              </Button>
              <span className="text-ink-muted">
                Page {page} of {data.meta.totalPages}, {data.meta.total} orders
              </span>
              <Button size="sm" variant="outline" disabled={page >= data.meta.totalPages} onClick={() => update({ page: String(page + 1) })}>
                Older
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
