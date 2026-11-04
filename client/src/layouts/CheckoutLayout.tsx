import { Link, Outlet, ScrollRestoration } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { useCartStore } from '@/features/cart/cart.store';
import { Logo } from './ShopLayout/Logo';

/** Checkout keeps the page quiet: no menus or banners, just the logo and a way back. */
export function CheckoutLayout() {
  const openCart = useCartStore((s) => s.open);
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="border-b border-line bg-white">
        <div className="container flex h-header items-center justify-between gap-4">
          <Logo />
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Lock className="h-4 w-4" aria-hidden />
            Secure checkout
          </span>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="container flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-ink-muted">
        <Link to="/" onClick={openCart} className="inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to cart
        </Link>
        <span>Cash on Delivery anywhere in Bangladesh</span>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
