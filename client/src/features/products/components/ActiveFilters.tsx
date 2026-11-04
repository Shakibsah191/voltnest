import { X } from 'lucide-react';
import { formatBDT } from '@/shared/lib/utils';
import { countActiveFilters, formatCapacity, formatPorts, formatWattage, type CollectionFilters } from '../filters';

function priceLabel(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `${formatBDT(min)} to ${formatBDT(max)}`;
  if (max !== undefined) return `Under ${formatBDT(max)}`;
  return `Over ${formatBDT(min!)}`;
}

export function ActiveFilters({ filters, onChange }: { filters: CollectionFilters; onChange: (f: CollectionFilters) => void }) {
  if (countActiveFilters(filters) === 0) return null;

  const chips: { label: string; remove: () => void }[] = [];
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      label: priceLabel(filters.minPrice, filters.maxPrice),
      remove: () => onChange({ ...filters, minPrice: undefined, maxPrice: undefined }),
    });
  }
  const lists: { key: 'wattage' | 'capacity' | 'ports'; format: (n: number) => string }[] = [
    { key: 'wattage', format: formatWattage },
    { key: 'capacity', format: formatCapacity },
    { key: 'ports', format: formatPorts },
  ];
  for (const { key, format } of lists) {
    for (const v of filters[key]) {
      chips.push({ label: format(v), remove: () => onChange({ ...filters, [key]: filters[key].filter((x) => x !== v) }) });
    }
  }
  if (filters.inStock) chips.push({ label: 'In stock', remove: () => onChange({ ...filters, inStock: false }) });

  const clearAll = () =>
    onChange({ sort: filters.sort, wattage: [], capacity: [], ports: [], inStock: false, minPrice: undefined, maxPrice: undefined });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={c.remove}
          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white py-1 pl-3 pr-2 text-xs font-medium hover:border-ink"
          aria-label={`Remove filter: ${c.label}`}
        >
          {c.label}
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
      <button type="button" onClick={clearAll} className="ml-1 text-xs font-semibold text-ink-muted underline underline-offset-4 hover:text-ink">
        Clear all
      </button>
    </div>
  );
}
