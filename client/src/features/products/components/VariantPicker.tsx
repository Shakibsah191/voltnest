import type { Variant } from '../types';
import { cn, formatBDT } from '@/shared/lib/utils';

const SWATCHES: Record<string, string> = {
  black: '#1B2230',
  white: '#FFFFFF',
  blue: '#2F6FE4',
  navy: '#1E2B55',
  red: '#D7362B',
  lavender: '#B9A8E8',
  mint: '#9EDFC6',
  coral: '#F28B74',
  sand: '#D9C7AE',
  gray: '#9AA3B2',
  graphite: '#4A4F5A',
  'space gray': '#6B7280',
  gunmetal: '#535A63',
  'forest green': '#2F5D46',
};

/** What the variants differ by, so the label reads "Colour: Black" or "Length: 2 m". */
function optionKind(variants: Variant[]): 'Colour' | 'Length' | 'Option' {
  const distinct = (key: 'color' | 'length') => new Set(variants.map((v) => v.options[key])).size;
  if (distinct('length') === variants.length) return 'Length';
  if (distinct('color') === variants.length) return 'Colour';
  return 'Option';
}

interface VariantPickerProps {
  variants: Variant[];
  selected: Variant;
  onSelect: (sku: string) => void;
}

export function VariantPicker({ variants, selected, onSelect }: VariantPickerProps) {
  if (variants.length < 2) return null;

  const kind = optionKind(variants);
  const pricesDiffer = new Set(variants.map((v) => v.price)).size > 1;

  return (
    <fieldset>
      <legend className="text-sm">
        <span className="text-ink-muted">{kind}: </span>
        <span className="font-semibold">{selected.name}</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((v) => {
          const soldOut = v.stock === 0;
          const active = v.sku === selected.sku;
          const swatch = kind === 'Colour' ? SWATCHES[(v.options.color ?? '').toLowerCase()] : undefined;
          return (
            <button
              key={v.sku}
              type="button"
              onClick={() => onSelect(v.sku)}
              disabled={soldOut}
              aria-pressed={active}
              aria-label={`${v.name}${pricesDiffer ? `, ${formatBDT(v.price)}` : ''}${soldOut ? ', sold out' : ''}`}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 text-sm font-medium transition-colors',
                active ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink',
                soldOut && 'cursor-not-allowed border-dashed text-ink-subtle line-through hover:border-line',
              )}
            >
              {swatch && (
                <span
                  aria-hidden
                  className={cn('h-4 w-4 rounded-pill border', active ? 'border-white/60' : 'border-line')}
                  style={{ backgroundColor: swatch }}
                />
              )}
              {v.name}
              {pricesDiffer && <span className={cn('tabular-nums', active ? 'text-white/70' : 'text-ink-muted')}>{formatBDT(v.price)}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
