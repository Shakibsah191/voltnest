import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Tone = 'error' | 'info' | 'success' | 'warning';

const tones: Record<Tone, { box: string; Icon: typeof Info }> = {
  error: { box: 'border-sale/30 bg-sale/5 text-ink', Icon: AlertCircle },
  warning: { box: 'border-warning/30 bg-warning/5 text-ink', Icon: AlertCircle },
  info: { box: 'border-brand-200 bg-brand-50 text-ink', Icon: Info },
  success: { box: 'border-success/30 bg-success/5 text-ink', Icon: CheckCircle2 },
};

const iconColor: Record<Tone, string> = { error: 'text-sale', warning: 'text-warning', info: 'text-brand', success: 'text-success' };

export function Alert({ tone = 'info', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const { box, Icon } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', box, className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor[tone])} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
