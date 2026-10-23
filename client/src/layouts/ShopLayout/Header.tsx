import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCategories } from '@/features/products/hooks';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/Skeleton';

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 text-ink', className)} aria-label="VoltNest home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path d="M18 4 8 18h7l-2 10 11-15h-7l1-9z" fill="#fff" />
      </svg>
      <span className="text-xl font-bold tracking-tight">voltnest</span>
    </Link>
  );
}

function SearchForm({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`); // search page arrives later
    onDone?.();
  };

  return (
    <form role="search" onSubmit={submit} className="relative w-full">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input
        id="site-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search chargers, power banks, cables…"
        className="h-10 w-full rounded-pill border border-line bg-surface-muted pl-10 pr-4 text-sm placeholder:text-ink-subtle focus:border-brand focus:bg-white focus:outline-none"
      />
    </form>
  );
}

export function Header() {
  const { data: categories, isLoading } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const menuButton = useRef<HTMLButtonElement>(null);

  // close panels whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  // close the mobile menu with Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const cartCount: number = 0; // Day 2: read from the cart store

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container flex h-header items-center gap-3 lg:gap-8">
        <button
          ref={menuButton}
          type="button"
          className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-4 w-20" />
                </li>
              ))}
            {categories?.map((c) => (
              <li key={c._id}>
                <NavLink
                  to={`/collections/${c.slug}`}
                  className={({ isActive }) =>
                    cn('text-sm font-medium transition-colors hover:text-brand', isActive && 'text-brand')
                  }
                >
                  {c.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block">
          <SearchForm />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted md:hidden"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((o) => !o)}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted"
            aria-label="Your account"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="container pb-3 md:hidden">
          <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <ul className="container divide-y divide-line">
            {categories?.map((c) => (
              <li key={c._id}>
                <Link to={`/collections/${c.slug}`} className="flex items-center justify-between py-4 text-base font-medium">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/account" className="flex py-4 text-base font-medium text-ink-muted">
                Sign in or create an account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
