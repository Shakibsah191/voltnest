import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max, size = 'md', label = 'Quantity', className }: QuantityStepperProps) {
  const btn = cn(
    'inline-flex items-center justify-center text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent',
    size === 'sm' ? 'h-8 w-8' : 'h-11 w-11',
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center rounded-pill border border-line bg-white', className)}
    >
      <button type="button" className={cn(btn, 'rounded-l-pill')} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn('min-w-8 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')} aria-live="polite">
        {value}
      </span>
      <button type="button" className={cn(btn, 'rounded-r-pill')} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
