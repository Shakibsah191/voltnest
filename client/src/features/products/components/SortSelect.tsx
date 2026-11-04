import { SORTS } from '../filters';
import type { ProductSort } from '../types';

export function SortSelect({ value, onChange }: { value: ProductSort; onChange: (v: ProductSort) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-ink-muted sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProductSort)}
        aria-label="Sort products"
        className="h-10 rounded-pill border border-line bg-white px-4 pr-8 text-sm font-medium focus:border-brand focus:outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
