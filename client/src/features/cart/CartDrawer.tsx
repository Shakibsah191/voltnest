import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Truck } from 'lucide-react';
import { Drawer } from '@/shared/ui/Drawer';
import { Alert } from '@/shared/ui/Alert';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Price } from '@/shared/ui/Price';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn, formatBDT } from '@/shared/lib/utils';
import { useCheckoutOptions } from '@/features/checkout/hooks';
import { useCartStore } from './cart.store';
import { useCart, useRemoveCartItem, useSetCartQuantity } from './hooks';
import { EMPTY_CART } from './types';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const navigate = useNavigate();
  const { data: cart = EMPTY_CART, isPending, isError, refetch } = useCart();
  const { data: options } = useCheckoutOptions();
  const setQuantity = useSetCartQuantity();
  const remove = useRemoveCartItem();

  // e.g. "Delivery: ৳50 in Rajshahi, ৳50 in Dhaka, ৳120 elsewhere"
  const deliveryNote = options?.zones
    .map((z) => `${formatBDT(z.charge)} ${z.id === 'outside_rajshahi' ? 'elsewhere' : z.label.replace(/^Inside /, 'in ')}`)
    .join(', ');
  const lines = cart.items;
  const mutationError = setQuantity.error ?? remove.error;

  const goToCheckout = () => {
    close();
    navigate('/checkout');
  };

  const footer = lines.length ? (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Subtotal</span>
        <span className="text-lg font-semibold tabular-nums">{formatBDT(cart.subtotal)}</span>
      </div>
      <p className="text-xs text-ink-muted">Delivery charge is added at checkout.</p>
      {cart.hasUnavailable && (
        <p className="text-sm text-sale">Remove the sold-out item to continue.</p>
      )}
      <Button fullWidth size="lg" onClick={goToCheckout} disabled={cart.hasUnavailable || cart.subtotal === 0}>
        Checkout
      </Button>
    </div>
  ) : undefined;

  return (
    <Drawer open={isOpen} onClose={close} side="right" title={`Your cart (${cart.itemCount})`} footer={footer}>
      {isPending && isOpen ? (
        <div className="space-y-5 p-5" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="mt-4 h-8 w-28 rounded-pill" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="font-semibold">Your cart didn’t load</p>
          <p className="mt-1 text-sm text-ink-muted">Check your connection, then try again.</p>
          <Button className="mt-5" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-surface-muted">
            <ShoppingBag className="h-7 w-7 text-ink-muted" />
          </span>
          <p className="mt-5 text-lg font-semibold">Your cart is empty</p>
          <p className="mt-1 text-sm text-ink-muted">Chargers, power banks and cables are a good place to start.</p>
          <Link to="/collections/all" onClick={close} className={buttonClasses('primary', 'md', 'mt-6')}>
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          {deliveryNote && (
            <div className="border-b border-line bg-surface-muted px-5 py-3.5">
              <p className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span>Delivery: {deliveryNote}</span>
              </p>
            </div>
          )}

          {(cart.notices.length > 0 || mutationError) && (
            <div className="space-y-2 px-5 pt-4">
              {cart.notices.map((n) => (
                <Alert key={n} tone="warning">{n}</Alert>
              ))}
              {mutationError && <Alert tone="error">{mutationError.message}</Alert>}
            </div>
          )}

          <ul className="divide-y divide-line px-5">
            {lines.map((line) => (
              <li key={line.variantSku} className={cn('flex gap-4 py-5', !line.available && 'opacity-70')}>
                <Link
                  to={`/products/${line.slug}?variant=${line.variantSku}`}
                  onClick={close}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted"
                >
                  {line.image && <img src={line.image} alt="" className={cn('h-full w-full object-cover', !line.available && 'grayscale')} />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${line.slug}?variant=${line.variantSku}`}
                        onClick={close}
                        className="line-clamp-2 text-sm font-medium hover:text-brand"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-muted">{line.variantName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove.mutate(line.variantSku)}
                      className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-muted hover:text-sale"
                      aria-label={`Remove ${line.name}, ${line.variantName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    {line.available ? (
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        max={line.maxQuantity}
                        onChange={(quantity) => setQuantity.mutate({ sku: line.variantSku, quantity })}
                        label={`Quantity of ${line.name}`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-sale">Sold out</span>
                    )}
                    {line.available && (
                      <Price
                        amount={line.unitPrice * line.quantity}
                        compareAt={line.compareAtPrice ? line.compareAtPrice * line.quantity : undefined}
                        size="sm"
                      />
                    )}
                  </div>
                  {line.available && line.quantity >= line.stock && (
                    <p className="mt-1.5 text-xs text-warning">That’s all we have in stock.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
