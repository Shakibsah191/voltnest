import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { dateTime, STATUS_LABEL } from '../status';
import type { OrderDetail, OrderStatus } from '../types';

/** The four steps a customer cares about. "Packing" counts as part of "Confirmed". */
const STEPS: { status: OrderStatus; label: string; covers: OrderStatus[] }[] = [
  { status: 'pending', label: 'Order placed', covers: ['pending'] },
  { status: 'confirmed', label: 'Confirmed', covers: ['confirmed', 'processing'] },
  { status: 'shipped', label: 'On the way', covers: ['shipped'] },
  { status: 'delivered', label: 'Delivered', covers: ['delivered'] },
];

const stepIndexOf = (status: OrderStatus) => STEPS.findIndex((s) => s.covers.includes(status));

export function StatusTimeline({ order }: { order: OrderDetail }) {
  const stopped = order.status === 'cancelled' || order.status === 'returned';
  // for a cancelled order, show how far it got before it stopped
  const lastActive = [...order.statusHistory].reverse().find((e) => stepIndexOf(e.status) >= 0)?.status ?? 'pending';
  const reached = stepIndexOf(stopped ? lastActive : order.status);
  const when = (step: (typeof STEPS)[number]) => order.statusHistory.find((e) => step.covers.includes(e.status))?.at;

  return (
    <div>
      <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
        {STEPS.map((step, i) => {
          const done = i <= reached;
          const at = when(step);
          return (
            <li key={step.status} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', i <= reached && !stopped ? 'bg-brand' : i <= reached ? 'bg-ink-subtle' : 'bg-line')}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-pill border-2',
                  done ? (stopped ? 'border-ink-subtle bg-ink-subtle text-white' : 'border-brand bg-brand text-white') : 'border-line bg-white text-ink-subtle',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : <span className="text-xs font-semibold">{i + 1}</span>}
              </span>
              <span className={cn('mt-2 text-xs font-medium sm:text-sm', done ? 'text-ink' : 'text-ink-subtle')}>
                {step.label}
                <span className="sr-only">{done ? ', done' : ', not yet'}</span>
              </span>
              {done && at && <span className="mt-0.5 hidden text-xs text-ink-muted sm:block">{dateTime.format(new Date(at))}</span>}
            </li>
          );
        })}
      </ol>

      {stopped && (
        <p className="mt-5 rounded-md bg-sale/5 px-4 py-3 text-sm text-ink">
          This order was <strong>{STATUS_LABEL[order.status].toLowerCase()}</strong>
          {order.statusHistory.at(-1)?.note ? `: ${order.statusHistory.at(-1)!.note}` : '.'}
        </p>
      )}

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-medium text-ink-muted hover:text-ink">Full history</summary>
        <ul className="mt-3 space-y-2.5 border-l-2 border-line pl-4">
          {[...order.statusHistory].reverse().map((e, i) => (
            <li key={`${e.status}-${e.at}-${i}`}>
              <span className="font-medium">{STATUS_LABEL[e.status]}</span>
              <span className="ml-2 text-ink-muted">{dateTime.format(new Date(e.at))}</span>
              {e.note && <p className="text-ink-muted">{e.note}</p>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
