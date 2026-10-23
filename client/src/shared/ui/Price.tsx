import { cn, formatBDT } from '@/shared/lib/utils';

interface PriceProps {
  amount: number;
  compareAt?: number | null;
  /** Show "From" when the product has variants at different prices. */
  from?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { now: 'text-base', was: 'text-xs' },
  md: { now: 'text-lg', was: 'text-sm' },
  lg: { now: 'text-3xl', was: 'text-base' },
};

export function Price({ amount, compareAt, from = false, size = 'md', className }: PriceProps) {
  const onSale = Boolean(compareAt && compareAt > amount);

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
      {from && <span className="text-sm text-ink-muted">From</span>}
      <span className={cn('font-semibold tabular-nums', sizes[size].now, onSale ? 'text-sale' : 'text-ink')}>
        {formatBDT(amount)}
      </span>
      {onSale && (
        <s className={cn('tabular-nums text-ink-subtle', sizes[size].was)}>
          <span className="sr-only">Was </span>
          {formatBDT(compareAt!)}
        </s>
      )}
    </p>
  );
}
