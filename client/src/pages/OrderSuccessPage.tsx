import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, PartyPopper } from 'lucide-react';
import { recallOrder } from '@/features/checkout/hooks';
import { buttonClasses } from '@/shared/ui/Button';
import { formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const deliveryDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' });

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the number is still on screen */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-line bg-white px-3 text-sm font-medium hover:border-ink"
    >
      {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function OrderSuccessPage() {
  const { orderNumber = '' } = useParams();
  const order = recallOrder(orderNumber);
  useDocumentTitle('Order placed');

  const firstName = order?.contact.name.split(/\s+/)[0];

  return (
    <div className="container max-w-2xl py-10 sm:py-16">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-success/10">
          <PartyPopper className="h-8 w-8 text-success" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">
          {firstName ? `Thank you, ${firstName}. Your order is placed.` : 'Your order is placed.'}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">
          {order
            ? `We’ll call ${order.contact.phone} to confirm it before we send it out.`
            : 'We’ll call you to confirm it before we send it out.'}
        </p>
      </div>

      <div className="mt-8 rounded-card border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">Order number</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">{orderNumber}</p>
          </div>
          <CopyButton text={orderNumber} />
        </div>

        {order && (
          <>
            <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Arrives by</dt>
                <dd className="mt-0.5 font-semibold">{deliveryDate.format(new Date(order.expectedDeliveryDate))}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Delivery area</dt>
                <dd className="mt-0.5 font-semibold">{order.deliveryZone.label}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Payment</dt>
                <dd className="mt-0.5 font-semibold">Cash on Delivery</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Pay when it arrives</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatBDT(order.total)}</dd>
              </div>
            </dl>

            <ul className="mt-6 divide-y divide-line border-t border-line">
              {order.items.map((i) => (
                <li key={i.name + i.variantName} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-medium">{i.name}</span>
                    <span className="block text-xs text-ink-muted">
                      {i.variantName}, quantity {i.quantity}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatBDT(i.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="tabular-nums">{order.deliveryCharge === 0 ? 'Free' : formatBDT(order.deliveryCharge)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBDT(order.total)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Keep the order number handy if you call us about this order.
      </p>
      <div className="mt-6 flex justify-center">
        <Link to="/collections/all" className={buttonClasses('primary', 'lg')}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
