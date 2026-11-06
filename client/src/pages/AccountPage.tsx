import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useMyOrders } from '@/features/orders/hooks';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { shortDate } from '@/features/orders/status';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatBDT } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/Button';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function AccountPage() {
  useDocumentTitle('My account');
  const user = useAuthStore((s) => s.user)!;
  const logout = useLogout();
  const recent = useMyOrders(1, 3);
  const a = user.defaultAddress;

  return (
    <div className="container max-w-3xl py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hello, {user.name.split(/\s+/)[0]}</h1>
          <p className="mt-1 text-ink-muted">{user.email}</p>
        </div>
        <Button variant="outline" onClick={() => logout.mutate()} loading={logout.isPending}>
          Log out
        </Button>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="font-semibold">Contact details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Mobile</dt>
              <dd>{user.phone ?? 'Not added yet'}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="font-semibold">Saved address</h2>
          {a ? (
            <address className="mt-3 text-sm not-italic leading-relaxed">
              {a.line1}
              <br />
              {[a.area, a.city, a.postcode].filter(Boolean).join(', ')}
            </address>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">Your first order’s address is saved here for next time.</p>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-card border border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Recent orders</h2>
          <Link to="/account/orders" className="text-sm font-medium text-brand hover:underline">
            See all orders
          </Link>
        </div>
        {recent.isPending ? (
          <Skeleton className="mt-4 h-16 w-full" />
        ) : !recent.data?.data.length ? (
          <p className="mt-3 text-sm text-ink-muted">No orders yet. Your orders show up here once you place one.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {recent.data.data.map((o) => (
              <li key={o.orderNumber}>
                <Link to={`/account/orders/${o.orderNumber}`} className="flex items-center gap-3 py-3 text-sm hover:text-brand">
                  <span className="font-medium tabular-nums">{o.orderNumber}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="ml-auto text-ink-muted">
                    {shortDate.format(new Date(o.createdAt))}, {formatBDT(o.total)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
