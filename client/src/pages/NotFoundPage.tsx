import { Link } from 'react-router-dom';
import { buttonClasses } from '@/shared/ui/Button';

export function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page isn’t here yet</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        The link may be wrong, or the page is still being built. Head back to the shop to keep browsing.
      </p>
      <Link to="/" className={buttonClasses('primary', 'md', 'mt-8')}>
        Back to the shop
      </Link>
    </div>
  );
}
