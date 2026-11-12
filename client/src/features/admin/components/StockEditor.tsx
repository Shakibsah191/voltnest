import { useEffect, useState } from 'react';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { useSetStock } from '../hooks';

/** Staff and owner: change how many of each variant are on the shelf. */
export function StockEditor({ productId, variants }: { productId: string; variants: { sku: string; name: string; stock: number }[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const save = useSetStock(productId);
  useEffect(() => setValues(Object.fromEntries(variants.map((v) => [v.sku, String(v.stock)]))), [variants]);

  const changed = variants.filter((v) => values[v.sku] !== undefined && values[v.sku] !== String(v.stock));
  const invalid = changed.some((v) => !/^\d+$/.test(values[v.sku] ?? ''));

  return (
    <div>
      <ul className="divide-y divide-line">
        {variants.map((v) => (
          <li key={v.sku} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{v.name}</span>
              <span className="block text-xs text-ink-muted">SKU {v.sku}</span>
            </span>
            <label className="sr-only" htmlFor={`stock-${v.sku}`}>
              Stock for {v.name}
            </label>
            <input
              id={`stock-${v.sku}`}
              type="number"
              inputMode="numeric"
              min={0}
              value={values[v.sku] ?? ''}
              onChange={(e) => setValues((s) => ({ ...s, [v.sku]: e.target.value }))}
              className="h-10 w-24 rounded-md border border-line px-3 text-right text-sm tabular-nums focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </li>
        ))}
      </ul>
      {save.isError && <Alert tone="error" className="mt-3">{save.error.message}</Alert>}
      {save.isSuccess && !changed.length && <Alert tone="success" className="mt-3">Stock saved.</Alert>}
      <Button
        className="mt-4"
        disabled={!changed.length || invalid}
        loading={save.isPending}
        onClick={() => save.mutate(changed.map((v) => ({ sku: v.sku, stock: Number(values[v.sku]) })))}
      >
        {changed.length ? `Save stock (${changed.length} changed)` : 'Save stock'}
      </Button>
    </div>
  );
}
