import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { useCart, useClearCartCache } from '@/features/cart/hooks';
import { deliveryChargeFor, rememberOrder, useCheckoutOptions, usePlaceOrder } from '@/features/checkout/hooks';
import {
  EMPTY_FIELDS,
  FIELD_ORDER,
  fromServerErrors,
  toPayload,
  validateCheckout,
  type CheckoutFields,
  type FieldErrors,
  type FieldName,
} from '@/features/checkout/form';
import { CheckoutSection } from '@/features/checkout/components/CheckoutSection';
import { ZonePicker } from '@/features/checkout/components/ZonePicker';
import { PaymentPicker } from '@/features/checkout/components/PaymentPicker';
import { OrderSummary } from '@/features/checkout/components/OrderSummary';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { TextAreaField, TextField } from '@/shared/ui/TextField';
import { formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

function CheckoutSkeleton() {
  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_400px]" aria-busy>
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56 w-full rounded-card" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-card" />
    </div>
  );
}

function orderErrorMessage(err: Error) {
  if (err instanceof ApiError && err.status === 401) return 'Your session ended. Log in again, or place the order as a guest.';
  return err.message;
}

export function CheckoutPage() {
  useDocumentTitle('Checkout');
  const navigate = useNavigate();
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const cartQuery = useCart();
  const optionsQuery = useCheckoutOptions();
  const placeOrder = usePlaceOrder();
  const clearCartCache = useClearCartCache();

  const [fields, setFields] = useState<CheckoutFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const prefilledFor = useRef<string | null>(null);

  const cart = cartQuery.data;
  const options = optionsQuery.data;
  const zoneIds = options?.zones.map((z) => z.id) ?? [];

  // stock and prices may have changed since the cart was last loaded
  useEffect(() => {
    void cartQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // logged in: fill in what we know, without overwriting anything already typed
  useEffect(() => {
    if (!user || prefilledFor.current === user.id) return;
    prefilledFor.current = user.id;
    const a = user.defaultAddress;
    setFields((f) => ({
      ...f,
      name: f.name || user.name,
      email: f.email || user.email,
      phone: f.phone || user.phone || '',
      ...(a && !f.line1 ? { line1: a.line1, area: a.area, city: a.city, postcode: a.postcode, zone: f.zone || a.zone } : {}),
    }));
  }, [user]);

  const set = <K extends keyof CheckoutFields>(key: K, value: CheckoutFields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const input = (key: FieldName) => ({
    value: fields[key] as string,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    error: errors[key],
  });

  if (authStatus === 'unknown' || cartQuery.isPending || optionsQuery.isPending) return <CheckoutSkeleton />;

  if (cartQuery.isError || optionsQuery.isError) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-xl font-semibold">Checkout didn’t load</h1>
        <p className="mt-2 text-ink-muted">{(cartQuery.error ?? optionsQuery.error)?.message}</p>
        <Button className="mt-6" onClick={() => (cartQuery.refetch(), optionsQuery.refetch())}>
          Try again
        </Button>
      </div>
    );
  }

  const lines = (cart?.items ?? []).filter((l) => l.available);
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-white">
          <ShoppingBag className="h-7 w-7 text-ink-muted" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink-muted">Add something to your cart, then come back here to place the order.</p>
        <Link to="/collections/all" className={buttonClasses('primary', 'md', 'mt-6')}>
          Start shopping
        </Link>
      </div>
    );
  }

  const deliveryCharge = fields.zone ? deliveryChargeFor(options, fields.zone) : null;
  const total = cart.subtotal + (deliveryCharge ?? 0);

  const focusField = (name: FieldName) => {
    const el = formRef.current?.querySelector<HTMLElement>(name === 'zone' ? 'input[name="zone"]' : `#co-${name}`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (placeOrder.isPending) return;
    const found = validateCheckout(fields, zoneIds);
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) return focusField(first);
    if (cart.hasUnavailable) return;

    placeOrder.mutate(toPayload(fields), {
      onSuccess: (order) => {
        rememberOrder(order);
        navigate(`/order-confirmed/${order.orderNumber}`, { replace: true });
        clearCartCache();
      },
      onError: (err) => {
        if (!(err instanceof ApiError)) return;
        if (err.code === 'VALIDATION_ERROR') {
          const server = fromServerErrors(err.fieldErrors);
          setErrors(server);
          const firstServer = FIELD_ORDER.find((k) => server[k]);
          if (firstServer) focusField(firstServer);
        }
        if (err.code === 'STOCK_CHANGED' || err.code === 'CART_EMPTY') void cartQuery.refetch();
      },
    });
  };

  const isGuest = authStatus !== 'authenticated';
  const orderError = placeOrder.isError && !(placeOrder.error instanceof ApiError && placeOrder.error.code === 'VALIDATION_ERROR');

  return (
    <div className="container py-6 lg:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>

      <form ref={formRef} noValidate onSubmit={submit} className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <CheckoutSection
            step={1}
            title="Contact"
            aside={
              isGuest ? (
                <Link to="/login?next=/checkout" className="text-sm font-medium text-brand hover:underline">
                  Log in
                </Link>
              ) : (
                <span className="truncate text-sm text-ink-muted">Logged in as {user?.name}</span>
              )
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="co-name" label="Full name" autoComplete="name" wrapperClassName="sm:col-span-2" {...input('name')} />
              <TextField
                id="co-phone"
                label="Mobile number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01712345678"
                hint="The courier calls this number."
                {...input('phone')}
              />
              <TextField
                id="co-email"
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                hint="Your order confirmation goes here."
                {...input('email')}
              />
            </div>
          </CheckoutSection>

          <CheckoutSection step={2} title="Delivery">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="co-line1"
                label="Address"
                autoComplete="address-line1"
                placeholder="House, road, area"
                wrapperClassName="sm:col-span-2"
                {...input('line1')}
              />
              <TextField id="co-area" label="Thana or area" autoComplete="address-level3" optional {...input('area')} />
              <TextField id="co-city" label="City or district" autoComplete="address-level2" {...input('city')} />
              <TextField id="co-postcode" label="Postcode" inputMode="numeric" autoComplete="postal-code" maxLength={4} optional {...input('postcode')} />
            </div>
            <div className="mt-5">
              <ZonePicker
                zones={options!.zones}
                value={fields.zone}
                error={errors.zone}
                onChange={(zone) => {
                  set('zone', zone);
                  // inside a city zone, the city is obvious
                  if (!fields.city.trim()) {
                    if (zone === 'inside_rajshahi') set('city', 'Rajshahi');
                    if (zone === 'inside_dhaka') set('city', 'Dhaka');
                  }
                }}
              />
            </div>
            <TextAreaField
              id="co-note"
              label="Note for the delivery"
              optional
              wrapperClassName="mt-5"
              placeholder="For example, the best time to call"
              maxLength={500}
              {...input('note')}
            />
            {!isGuest && !user?.defaultAddress && (
              <label className="mt-4 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={fields.saveAddress}
                  onChange={(e) => set('saveAddress', e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                Save this address to my account
              </label>
            )}
          </CheckoutSection>

          <CheckoutSection step={3} title="Payment">
            <PaymentPicker methods={options!.paymentMethods} total={formatBDT(total)} />
          </CheckoutSection>
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummary lines={lines} subtotal={cart.subtotal} deliveryCharge={deliveryCharge}>
            <div className="space-y-3">
              {cart.notices.map((n) => (
                <Alert key={n} tone="warning">
                  {n}
                </Alert>
              ))}
              {cart.hasUnavailable && (
                <Alert tone="error">
                  Something in your cart sold out. Open the cart and remove it to continue.
                </Alert>
              )}
              {orderError && <Alert tone="error">{orderErrorMessage(placeOrder.error)}</Alert>}
              <Button type="submit" size="lg" fullWidth loading={placeOrder.isPending} disabled={cart.hasUnavailable}>
                {placeOrder.isPending ? 'Placing your order…' : 'Place order'}
              </Button>
              <p className="text-center text-xs text-ink-muted">
                {deliveryCharge === null
                  ? 'Choose a delivery area to see your total.'
                  : `You pay ${formatBDT(total)} in cash when the order arrives.`}
              </p>
            </div>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
