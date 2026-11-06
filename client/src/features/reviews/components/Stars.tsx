import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/** Read-only stars, e.g. 4.3 shows 4 filled. */
export function Stars({ value, size = 'sm', className }: { value: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const filled = Math.round(value);
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cn(px, n <= filled ? 'fill-ink text-ink' : 'fill-surface-sunken text-surface-sunken')} />
      ))}
    </span>
  );
}

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Five radio buttons drawn as stars, so it works with the keyboard and screen readers. */
export function StarInput({ value, onChange, error }: { value: number; onChange: (n: number) => void; error?: string }) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="peer sr-only"
                aria-label={`${n} ${n === 1 ? 'star' : 'stars'}, ${WORDS[n]}`}
              />
              <Star
                aria-hidden
                className={cn(
                  'h-8 w-8 rounded-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand',
                  n <= shown ? 'fill-ink text-ink' : 'fill-surface-sunken text-surface-sunken',
                )}
              />
            </label>
          ))}
        </div>
        <span className="text-sm text-ink-muted" aria-hidden>
          {WORDS[shown]}
        </span>
      </div>
      {error && <p className="mt-1.5 text-sm text-sale">{error}</p>}
    </fieldset>
  );
}
