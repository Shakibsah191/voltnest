import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Facets } from '../types';
import {
  formatCapacity,
  formatPorts,
  formatWattage,
  PRICE_PRESETS,
  type CollectionFilters,
} from '../filters';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';

interface FilterPanelProps {
  filters: CollectionFilters;
  facets?: Facets;
  onChange: (next: CollectionFilters) => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-5 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-brand" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-ink-subtle">{count}</span>}
    </label>
  );
}

const toggle = (list: number[], value: number) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function FilterPanel({ filters, facets, onChange }: FilterPanelProps) {
  const [min, setMin] = useState(filters.minPrice?.toString() ?? '');
  const [max, setMax] = useState(filters.maxPrice?.toString() ?? '');

  // keep the price inputs in step when the URL changes (chips, presets, back button)
  useEffect(() => setMin(filters.minPrice?.toString() ?? ''), [filters.minPrice]);
  useEffect(() => setMax(filters.maxPrice?.toString() ?? ''), [filters.maxPrice]);

  const applyCustom = (e: FormEvent) => {
    e.preventDefault();
    const toNum = (v: string) => (v.trim() === '' ? undefined : Math.max(0, Number(v)) || undefined);
    onChange({ ...filters, minPrice: toNum(min), maxPrice: toNum(max) });
  };

  const setPreset = (pMin?: number, pMax?: number) => {
    const same = filters.minPrice === pMin && filters.maxPrice === pMax;
    const next = same ? { minPrice: undefined, maxPrice: undefined } : { minPrice: pMin, maxPrice: pMax };
    onChange({ ...filters, ...next });
  };

  const optionSections: { key: 'wattage' | 'capacity' | 'ports'; title: string; format: (n: number) => string }[] = [
    { key: 'wattage', title: 'Wattage', format: formatWattage },
    { key: 'capacity', title: 'Capacity', format: formatCapacity },
    { key: 'ports', title: 'Ports', format: formatPorts },
  ];

  return (
    <div>
      <Section title="Availability">
        <CheckRow checked={filters.inStock} onChange={() => onChange({ ...filters, inStock: !filters.inStock })} label="In stock only" />
      </Section>

      <Section title="Price">
        <div className="space-y-1">
          {PRICE_PRESETS.map((p) => (
            <CheckRow
              key={p.label}
              checked={filters.minPrice === p.min && filters.maxPrice === p.max}
              onChange={() => setPreset(p.min, p.max)}
              label={p.label}
            />
          ))}
        </div>
        <form onSubmit={applyCustom} className="mt-4 flex items-end gap-2">
          <label className="flex-1 text-xs text-ink-muted">
            Min ৳
            <input
              inputMode="numeric"
              value={min}
              onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={facets ? String(facets.price.min) : '0'}
              className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
          <label className="flex-1 text-xs text-ink-muted">
            Max ৳
            <input
              inputMode="numeric"
              value={max}
              onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={facets ? String(facets.price.max) : ''}
              className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
          <Button type="submit" variant="outline" size="sm" className="h-10">
            Go
          </Button>
        </form>
      </Section>

      {optionSections.map(({ key, title, format }) => {
        const values = facets?.[key] ?? [];
        if (values.length < 2 && !filters[key].length) return null; // a filter with one option isn't useful
        return (
          <Section key={key} title={title}>
            <div className={cn('space-y-0.5', values.length > 8 && 'max-h-72 overflow-y-auto pr-1')}>
              {values.map((v) => (
                <CheckRow
                  key={v.value}
                  checked={filters[key].includes(v.value)}
                  onChange={() => onChange({ ...filters, [key]: toggle(filters[key], v.value) })}
                  label={format(v.value)}
                  count={v.count}
                />
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
