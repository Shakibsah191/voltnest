import { Eye, EyeOff } from 'lucide-react';

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-muted hover:text-ink"
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
