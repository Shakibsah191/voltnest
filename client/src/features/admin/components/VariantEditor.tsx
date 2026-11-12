import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';
import type { VariantForm } from '../types';

export const emptyVariant = (): VariantForm => ({
  sku: '',
  name: '',
  options: {},
  price: '',
  compareAtPrice: '',
  costPrice: '',
  stock: 0,
  image: '',
});

const cell = 'h-10 w-full rounded-md border bg-white px-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25';

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  className,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  error?: string;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn('block text-xs text-ink-muted', className)}>
      {label}
      <input
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        min={type === 'number' ? 0 : undefined}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(cell, 'mt-1 text-ink', error ? 'border-sale' : 'border-line')}
      />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

/** One card per variant (colour, size…). Each has its own SKU, price, cost and stock. */
export function VariantEditor({
  variants,
  onChange,
  errors,
}: {
  variants: VariantForm[];
  onChange: (v: VariantForm[]) => void;
  errors: Record<string, string>;
}) {
  const set = (i: number, patch: Partial<VariantForm>) => onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const setOpt = (i: number, key: keyof VariantForm['options'], value: string) =>
    set(i, { options: { ...variants[i]!.options, [key]: key === 'color' ? value : value === '' ? '' : Number(value) } });
  const num = (v: string) => (v === '' ? '' : Number(v));
  const err = (i: number, f: string) => errors[`variants.${i}.${f}`];

  return (
    <div className="space-y-3">
      {variants.map((v, i) => (
        <div key={i} className="rounded-card border border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Variant {i + 1}</p>
            {variants.length > 1 && (
              <button type="button" onClick={() => onChange(variants.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-sale">
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Name (e.g. Black / 1 m)" value={v.name} onChange={(x) => set(i, { name: x })} error={err(i, 'name')} className="sm:col-span-2" />
            <Field label="SKU" value={v.sku} onChange={(x) => set(i, { sku: x.toUpperCase() })} error={err(i, 'sku')} placeholder="VN-041-1" className="sm:col-span-2" />
            <Field label="Price (৳)" type="number" value={v.price} onChange={(x) => set(i, { price: num(x) })} error={err(i, 'price')} />
            <Field label="Was-price (৳, optional)" type="number" value={v.compareAtPrice} onChange={(x) => set(i, { compareAtPrice: num(x) })} error={err(i, 'compareAtPrice')} />
            <Field label="Cost price (৳, private)" type="number" value={v.costPrice} onChange={(x) => set(i, { costPrice: num(x) })} error={err(i, 'costPrice')} />
            <Field label="Stock" type="number" value={v.stock} onChange={(x) => set(i, { stock: num(x) })} error={err(i, 'stock')} />
            <Field label="Colour" value={v.options.color} onChange={(x) => setOpt(i, 'color', x)} />
            <Field label="Watts" type="number" value={v.options.wattage} onChange={(x) => setOpt(i, 'wattage', x)} />
            <Field label="Capacity (mAh)" type="number" value={v.options.capacity} onChange={(x) => setOpt(i, 'capacity', x)} />
            <Field label="Ports" type="number" value={v.options.ports} onChange={(x) => setOpt(i, 'ports', x)} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...variants, emptyVariant()])} disabled={variants.length >= 20}>
        <Plus className="h-4 w-4" aria-hidden />
        Add variant
      </Button>
    </div>
  );
}
