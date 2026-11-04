import type { ReactNode } from 'react';
import type { CartLine } from '@/features/cart/types';
import { formatBDT } from '@/shared/lib/utils';

interface OrderSummaryProps {
  lines: CartLine[];
  subtotal: number;
  /** null until a delivery area is chosen */
  deliveryCharge: number | null;
  children?: ReactNode;
}

export function OrderSummary({ lines, subtotal, deliveryCharge, children }: OrderSummaryProps) {
  const total = subtotal + (deliveryCharge ?? 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <section aria-labelledby="summary-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 id="summary-title" className="text-lg font-semibold">
        Order summary <span className="text-sm font-normal text-ink-muted">({count} {count === 1 ? 'item' : 'items'})</span>
      </h2>

      <ul className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
        {lines.map((l) => (
          <li key={l.variantSku} className="flex items-center gap-3">
            <span className="relative h-14 w-14 shrink-0 rounded-md bg-surface-muted">
              {l.image && <img src={l.image} alt="" className="h-full w-full rounded-md object-cover" />}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-pill bg-ink px-1 text-[11px] font-bold text-white">
                <span className="sr-only">Quantity </span>
                {l.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-medium">{l.name}</span>
              <span className="block text-xs text-ink-muted">{l.variantName}</span>
            </span>
            <span className="text-sm font-medium tabular-nums">{formatBDT(l.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Delivery</dt>
          <dd className="tabular-nums">
            {deliveryCharge === null ? <span className="text-ink-subtle">Choose an area</span> : deliveryCharge === 0 ? <span className="font-medium text-success">Free</span> : formatBDT(deliveryCharge)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-xl font-bold tabular-nums">{formatBDT(total)}</dd>
        </div>
      </dl>

      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
