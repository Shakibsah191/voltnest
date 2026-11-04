import { Banknote, CreditCard } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/utils';
import type { PaymentMethodOption } from '../types';

const ICONS = { cod: Banknote, sslcommerz: CreditCard } as const;

export function PaymentPicker({ methods, total }: { methods: PaymentMethodOption[]; total: string }) {
  return (
    <fieldset>
      <legend className="sr-only">Payment method</legend>
      <div className="space-y-3">
        {methods.map((m) => {
          const Icon = ICONS[m.id] ?? Banknote;
          return (
            <label
              key={m.id}
              className={cn(
                'flex items-center gap-3 rounded-card border p-4',
                m.available ? 'cursor-pointer border-brand bg-brand-50/60 ring-1 ring-brand' : 'cursor-not-allowed border-line bg-surface-muted text-ink-muted',
              )}
            >
              <input
                type="radio"
                name="payment"
                value={m.id}
                checked={m.id === 'cod'}
                disabled={!m.available}
                readOnly
                className="h-4 w-4 shrink-0 accent-brand"
              />
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{m.label}</span>
                <span className="block text-sm">{m.id === 'cod' ? `Pay ${total} in cash when your order arrives` : m.description}</span>
              </span>
              {!m.available && <Badge>Soon</Badge>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
