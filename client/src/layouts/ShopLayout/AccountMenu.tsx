import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Package, User, UserRound } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { useLogout } from '@/features/auth/hooks';

const iconButton = 'inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted';

/** Guest: a link to log in. Logged in: initials that open a small menu. */
export function AccountMenu() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status !== 'authenticated' || !user) {
    const next = location.pathname === '/login' || location.pathname === '/register' ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`;
    return (
      <Link to={`/login${next}`} className={iconButton} aria-label="Log in or create an account">
        <User className="h-5 w-5" />
      </Link>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={iconButton}
        aria-label={`Account menu for ${user.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-brand text-xs font-bold text-white">{initials || '?'}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-64 animate-drop-in rounded-card border border-line bg-white p-2 shadow-pop">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" to="/account" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-surface-muted">
            <UserRound className="h-4 w-4 text-ink-muted" aria-hidden />
            My account
          </Link>
          <Link role="menuitem" to="/account/orders" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-surface-muted">
            <Package className="h-4 w-4 text-ink-muted" aria-hidden />
            My orders
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
          >
            <LogOut className="h-4 w-4 text-ink-muted" aria-hidden />
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}
