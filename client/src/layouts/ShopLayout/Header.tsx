import { useEffect, useRef, useState, type FormEvent } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Menu, Search, ShoppingBag } from 'lucide-react';
import { useCategories } from '@/features/products/hooks';
import { useCartStore } from '@/features/cart/cart.store';
import { useCart } from '@/features/cart/hooks';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Logo } from './Logo';
import { MegaMenuPanel } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { AccountMenu } from './AccountMenu';

export { Logo };

function SearchForm({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [q, setQ] = useState(location.pathname === '/search' ? params.get('q') ?? '' : '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    onDone?.();
  };

  return (
    <form role="search" onSubmit={submit} className="relative w-full">
      <label htmlFor={autoFocus ? 'site-search-mobile' : 'site-search'} className="sr-only">
        Search products
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input
        id={autoFocus ? 'site-search-mobile' : 'site-search'}
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
  const { data: categories = [], isLoading } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaSlug, setMegaSlug] = useState<string | null>(null);
  const megaTimer = useRef<number>();
  const location = useLocation();

  const cartCount = useCart().data?.itemCount ?? 0;
  const openCart = useCartStore((s) => s.open);

  // close everything whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMegaSlug(null);
  }, [location.pathname, location.search]);

  useEffect(() => () => window.clearTimeout(megaTimer.current), []);

  // Escape closes the mega menu
  useEffect(() => {
    if (!megaSlug) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMegaSlug(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [megaSlug]);

  /** Small delay so the panel doesn't flicker when the mouse just passes over the nav. */
  const scheduleMega = (slug: string | null, delay: number) => {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => setMegaSlug(slug), delay);
  };

  const megaCategory = categories.find((c) => c.slug === megaSlug);

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur"
      onMouseLeave={() => scheduleMega(null, 150)}
    >
      <div className="container flex h-header items-center gap-3 lg:gap-8">
        <button
          type="button"
          className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted lg:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Logo />

        <nav aria-label="Main" className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-6">
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-4 w-20" />
                </li>
              ))}
            {categories.map((c) => (
              <li
                key={c._id}
                className="flex h-full items-center"
                onMouseEnter={() => scheduleMega(c.slug, megaSlug ? 0 : 120)}
              >
                <NavLink
                  to={`/collections/${c.slug}`}
                  onFocus={() => scheduleMega(c.slug, 0)}
                  aria-expanded={megaSlug === c.slug}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-full items-center gap-1 text-sm font-medium transition-colors hover:text-brand',
                      (isActive || megaSlug === c.slug) && 'text-brand',
                      megaSlug === c.slug && 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand',
                    )
                  }
                >
                  {c.name}
                  <ChevronDown
                    aria-hidden
                    className={cn('h-3.5 w-3.5 transition-transform', megaSlug === c.slug && 'rotate-180')}
                  />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block" onMouseEnter={() => scheduleMega(null, 150)}>
          <SearchForm key={location.pathname + location.search} />
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
          <AccountMenu />
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-surface-muted"
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? '99+' : cartCount}
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

      {megaCategory && (
        <div className="hidden lg:block" onMouseEnter={() => window.clearTimeout(megaTimer.current)}>
          <MegaMenuPanel category={megaCategory} onNavigate={() => setMegaSlug(null)} />
        </div>
      )}

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
    </header>
  );
}
