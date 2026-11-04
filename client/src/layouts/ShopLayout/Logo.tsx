import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className={cn('flex items-center gap-2 text-ink', className)} aria-label="VoltNest home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path d="M18 4 8 18h7l-2 10 11-15h-7l1-9z" fill="#fff" />
      </svg>
      <span className="text-xl font-bold tracking-tight">voltnest</span>
    </Link>
  );
}
