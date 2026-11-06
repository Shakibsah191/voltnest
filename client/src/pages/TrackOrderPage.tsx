import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useOrder } from '@/features/orders/hooks';
import { OrderDetailView } from '@/features/orders/components/OrderDetailView';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { isValidBdPhone, normalizeBdPhone } from '@/shared/lib/validation';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

/** Guests check an order with the order number and the phone used at checkout. */
export function TrackOrderPage() {
  useDocumentTitle('Track your order');
  const [params] = useSearchParams();
  const isLoggedIn = useAuthStore((s) => s.status === 'authenticated');
  const [orderInput, setOrderInput] = useState(params.get('order') ?? '');
  const [phoneInput, setPhoneInput] = useState('');
  const [errors, setErrors] = useState<{ order?: string; phone?: string }>({});
  const [lookup, setLookup] = useState<{ order: string; phone: string } | null>(null);
  const query = useOrder(lookup?.order ?? null, lookup?.phone);

  // a logged-in customer arriving from the email link goes straight to their order
  const fromLink = params.get('order');
  if (isLoggedIn && fromLink && !lookup) return <Navigate to={`/account/orders/${encodeURIComponent(fromLink)}`} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const order = orderInput.trim().toUpperCase();
    const found: typeof errors = {};
    if (!/^VN-\d{6}-\d{4,6}$/.test(order)) found.order = 'Enter the order number from your email, like VN-261105-4821';
    if (!isValidBdPhone(phoneInput)) found.phone = 'Enter the mobile number you used at checkout';
    setErrors(found);
    if (Object.keys(found).length) return;
    setLookup({ order, phone: normalizeBdPhone(phoneInput) });
  };

  return (
    <div className="container max-w-3xl py-8 lg:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Track your order</h1>
      <p className="mt-1 text-ink-muted">
        Enter your order number and mobile number.
        {!isLoggedIn && (
          <>
            {' '}
            Have an account?{' '}
            <Link to="/login?next=/account/orders" className="font-medium text-brand hover:underline">
              Log in to see all your orders
            </Link>
            .
          </>
        )}
      </p>

      <form noValidate onSubmit={submit} className="mt-6 grid gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start sm:p-6">
        <TextField id="track-order" label="Order number" placeholder="VN-261105-4821" autoCapitalize="characters" value={orderInput} onChange={(e) => setOrderInput(e.target.value)} error={errors.order} />
        <TextField id="track-phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="01712345678" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} error={errors.phone} />
        <Button type="submit" size="lg" className="sm:mt-7" loading={query.isFetching}>
          Track
        </Button>
      </form>

      <div className="mt-6">
        {query.isError && <Alert tone="error">{query.error.message}</Alert>}
        {query.data && <OrderDetailView order={query.data} />}
      </div>
    </div>
  );
}
