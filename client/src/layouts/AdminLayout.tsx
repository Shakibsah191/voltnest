import { NavLink, Navigate, Outlet, ScrollRestoration, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, ShieldAlert, ShoppingBag, Store, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { useLogout } from '@/features/auth/hooks';
import { Badge } from '@/shared/ui/Badge';
import { buttonClasses } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';
import { Logo } from './ShopLayout/Logo';

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true, ownerOnly: false },
  { to: '/admin/orders', label: 'Orders', Icon: ShoppingBag, end: false, ownerOnly: false },
  { to: '/admin/products', label: 'Products', Icon: Package, end: false, ownerOnly: false },
  { to: '/admin/staff', label: 'Staff', Icon: Users, end: false, ownerOnly: true },
];

/** The admin panel frame. Only staff and the owner get past the checks at the top. */
export function AdminLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Checking your session">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-r-transparent" />
      </div>
    );
  }
  if (status === 'guest' || !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (user.role === 'customer') {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center text-center">
        <ShieldAlert className="h-10 w-10 text-ink-muted" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">This area is for VoltNest staff</h1>
        <p className="mt-2 text-ink-muted">Your account doesn’t have access to the admin panel.</p>
        <Link to="/" className={buttonClasses('primary', 'md', 'mt-6')}>
          Back to the shop
        </Link>
      </div>
    );
  }

  const isOwner = user.role === 'admin';
  const items = NAV.filter((n) => isOwner || !n.ownerOnly);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-brand-50 text-brand' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    );

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          <Logo />
          <Badge tone="bestseller">Admin</Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right text-sm sm:block">
              <span className="block font-medium leading-tight">{user.name}</span>
              <span className="block text-xs text-ink-muted">{isOwner ? 'Owner' : 'Staff'}</span>
            </span>
            <Link to="/" className={buttonClasses('ghost', 'sm')} aria-label="View the shop">
              <Store className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Shop</span>
            </Link>
            <button type="button" onClick={() => logout.mutate()} className={buttonClasses('ghost', 'sm')} aria-label="Log out">
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
        {/* phones and tablets: the sections as a row of tabs */}
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">
          {items.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="lg:flex">
        <nav aria-label="Admin sections" className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col gap-1 border-r border-line bg-white p-3 lg:flex">
          {items.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
