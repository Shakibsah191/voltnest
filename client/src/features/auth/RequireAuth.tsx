import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth.store';

/** Wrap a page that needs a logged-in user. Guests go to /login and come back after. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div className="container flex justify-center py-24" role="status" aria-label="Checking your session">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-r-transparent" />
      </div>
    );
  }
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}
