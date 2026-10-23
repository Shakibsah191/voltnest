import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type Tone = 'sale' | 'new' | 'bestseller' | 'neutral' | 'success' | 'warning';

const tones: Record<Tone, string> = {
  sale: 'bg-sale text-white',
  new: 'bg-brand text-white',
  bestseller: 'bg-ink text-white',
  neutral: 'bg-surface-sunken text-ink-muted',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold leading-5',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
