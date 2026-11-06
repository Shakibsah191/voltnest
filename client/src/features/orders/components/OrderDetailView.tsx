import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { Button } from '@/shared/ui/Button';
import { formatBDT } from '@/shared/lib/utils';
import { longDate, shortDate } from '../status';
import type { OrderDetail } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { StatusTimeline } from './StatusTimeline';

/** Shared by My orders (logged in) and Track order (guests). */
export function OrderDetailView({ order }: { order: OrderDetail }) {
  const [reviewing, setReviewing] = useState<string | null>(null);
  const a = order.shippingAddress;
  const open = !['delivered', 'cancelled', 'returned'].includes(order.status);

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">Order {order.orderNumber}</p>
            <h2 className="mt-0.5 text-xl font-bold">
              {order.status === 'delivered' && order.deliveredAt
                ? `Delivered on ${longDate.format(new Date(order.deliveredAt))}`
                : open
                  ? `Arrives by ${longDate.format(new Date(order.expectedDeliveryDate))}`
                  : `Placed on ${shortDate.format(new Date(order.createdAt))}`}
            </h2>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-6">
          <StatusTimeline order={order} />
        </div>
        {order.courier && (
          <p className="mt-4 text-sm text-ink-muted">
            Courier: <span className="font-medium text-ink">{order.courier.name}</span>
            {order.courier.trackingNumber && `, tracking number ${order.courier.trackingNumber}`}
          </p>
        )}
      </section>

      <section className="rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="items-title">
        <h2 id="items-title" className="font-semibold">
          Items
        </h2>
        {order.canReview && <p className="mt-1 text-sm text-ink-muted">Your order arrived. Tell other buyers what you think.</p>}
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.variantSku} className="py-4">
              <div className="flex items-center gap-3">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                  {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  {i.productSlug ? (
                    <Link to={`/products/${i.productSlug}?variant=${i.variantSku}`} className="line-clamp-1 text-sm font-medium hover:text-brand">
                      {i.name}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 text-sm font-medium">{i.name}</span>
                  )}
                  <span className="block text-xs text-ink-muted">
                    {i.variantName}, quantity {i.quantity}
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatBDT(i.lineTotal)}</span>
              </div>
              {order.canReview && (
                <div className="mt-3 pl-[4.25rem]">
                  {i.reviewed ? (
                    <p className="inline-flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Reviewed, thank you
                    </p>
                  ) : reviewing === i.productId ? (
                    <ReviewForm
                      orderNumber={order.orderNumber}
                      productId={i.productId}
                      productSlug={i.productSlug}
                      productName={i.name}
                      onCancel={() => setReviewing(null)}
                    />
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setReviewing(i.productId)}>
                      Write a review
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatBDT(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Delivery, {order.deliveryZone.label}</dt>
            <dd className="tabular-nums">{order.deliveryCharge === 0 ? 'Free' : formatBDT(order.deliveryCharge)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBDT(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-5 rounded-card border border-line bg-white p-5 text-sm sm:grid-cols-2 sm:p-6">
        <div>
          <h2 className="font-semibold">Delivery address</h2>
          <address className="mt-2 not-italic leading-relaxed text-ink-muted">
            {order.contact.name}
            <br />
            {a.line1}
            <br />
            {[a.area, a.city, a.postcode].filter(Boolean).join(', ')}
            <br />
            {order.contact.phone}
          </address>
        </div>
        <div>
          <h2 className="font-semibold">Payment</h2>
          <p className="mt-2 text-ink-muted">
            Cash on Delivery,{' '}
            {order.paymentStatus === 'paid' ? 'paid' : open ? `pay ${formatBDT(order.total)} when it arrives` : 'not paid'}
          </p>
          {order.customerNote && (
            <>
              <h2 className="mt-4 font-semibold">Your note</h2>
              <p className="mt-2 text-ink-muted">{order.customerNote}</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
