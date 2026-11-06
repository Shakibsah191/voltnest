import { useParams } from 'react-router-dom';
import { useOrder } from '@/features/orders/hooks';
import { OrderDetailView } from '@/features/orders/components/OrderDetailView';
import { ApiError } from '@/shared/api-client';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function OrderDetailPage() {
  const { orderNumber = '' } = useParams();
  useDocumentTitle(`Order ${orderNumber}`);
  const { data, isPending, isError, error, refetch } = useOrder(orderNumber);

  return (
    <div className="container max-w-3xl py-6 lg:py-10">
      <Breadcrumbs
        items={[
          { label: 'My account', to: '/account' },
          { label: 'My orders', to: '/account/orders' },
          { label: orderNumber },
        ]}
      />
      <div className="mt-5">
        {isPending ? (
          <Skeleton className="h-80 w-full rounded-card" />
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="font-semibold">{error instanceof ApiError && error.status === 404 ? 'This order isn’t in your account' : 'This order didn’t load'}</p>
            <p className="mt-1 text-sm text-ink-muted">{error.message}</p>
            {!(error instanceof ApiError && error.status === 404) && (
              <Button className="mt-4" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            )}
          </div>
        ) : (
          <OrderDetailView order={data} />
        )}
      </div>
    </div>
  );
}
