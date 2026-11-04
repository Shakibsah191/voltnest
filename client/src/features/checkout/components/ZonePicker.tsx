import { cn, formatBDT } from '@/shared/lib/utils';
import type { DeliveryZoneOption } from '../types';

interface ZonePickerProps {
  zones: DeliveryZoneOption[];
  value: string;
  onChange: (zoneId: string) => void;
  freeDelivery: boolean;
  error?: string;
}

export function ZonePicker({ zones, value, onChange, freeDelivery, error }: ZonePickerProps) {
  return (
    <fieldset aria-describedby={error ? 'zone-error' : undefined}>
      <legend className="mb-2 text-sm font-medium">Delivery area</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {zones.map((z) => {
          const checked = value === z.id;
          return (
            <label
              key={z.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors',
                checked ? 'border-brand bg-brand-50/60 ring-1 ring-brand' : error ? 'border-sale/60' : 'border-line hover:border-ink-subtle',
              )}
            >
              <input
                id={`zone-${z.id}`}
                type="radio"
                name="zone"
                value={z.id}
                checked={checked}
                onChange={() => onChange(z.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{z.label}</span>
                <span className="mt-0.5 block text-sm text-ink-muted">{z.description}</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {z.minDays} to {z.maxDays} days
                </span>
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums">
                {freeDelivery ? (
                  <>
                    <span className="text-success">Free</span>
                    <s className="block text-xs font-normal text-ink-subtle">{formatBDT(z.charge)}</s>
                  </>
                ) : (
                  formatBDT(z.charge)
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id="zone-error" className="mt-2 text-sm text-sale">
          {error}
        </p>
      )}
    </fieldset>
  );
}
