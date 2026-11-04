import { Package } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { useLogout } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/Button';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function AccountPage() {
  useDocumentTitle('My account');
  const user = useAuthStore((s) => s.user)!;
  const logout = useLogout();
  const a = user.defaultAddress;

  return (
    <div className="container max-w-3xl py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hello, {user.name.split(/\s+/)[0]}</h1>
          <p className="mt-1 text-ink-muted">{user.email}</p>
        </div>
        <Button variant="outline" onClick={() => logout.mutate()} loading={logout.isPending}>
          Log out
        </Button>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="font-semibold">Contact details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Mobile</dt>
              <dd>{user.phone ?? 'Not added yet'}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="font-semibold">Saved address</h2>
          {a ? (
            <address className="mt-3 text-sm not-italic leading-relaxed">
              {a.line1}
              <br />
              {[a.area, a.city, a.postcode].filter(Boolean).join(', ')}
            </address>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">Your first order’s address is saved here for next time.</p>
          )}
        </section>
      </div>

      <section className="mt-5 flex items-center gap-4 rounded-card border border-dashed border-line p-5">
        <Package className="h-6 w-6 shrink-0 text-ink-muted" aria-hidden />
        <p className="text-sm text-ink-muted">Order history and tracking will appear here.</p>
      </section>
    </div>
  );
}
