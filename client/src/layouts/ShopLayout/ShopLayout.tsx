import { Outlet, ScrollRestoration } from 'react-router-dom';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';

export function ShopLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      {/* Key by path only, so changing filters or ?variant= doesn't jump to the top */}
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  );
}
