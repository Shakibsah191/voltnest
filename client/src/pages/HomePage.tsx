import { useHome } from '@/features/products/hooks';
import { HeroCarousel } from '@/features/home/HeroCarousel';
import { CategoryRail } from '@/features/home/CategoryRail';
import { ShelfTabs } from '@/features/home/ShelfTabs';
import { TrustBadges } from '@/features/home/TrustBadges';
import { NewsletterStrip } from '@/features/home/NewsletterStrip';
import { Button } from '@/shared/ui/Button';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function HomePage() {
  const { data, isPending, isError, error, refetch } = useHome();
  useDocumentTitle();

  return (
    <div className="container space-y-section py-6 lg:py-8">
      <HeroCarousel />

      {isError ? (
        <div role="alert" className="rounded-card border border-line bg-surface-muted p-8 text-center">
          <h2 className="text-lg font-semibold">The shop didn’t load</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{error.message}</p>
          <Button className="mt-5" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <CategoryRail categories={data?.categories ?? []} loading={isPending} />
          <ShelfTabs newArrivals={data?.newArrivals ?? []} bestsellers={data?.bestsellers ?? []} loading={isPending} />
        </>
      )}

      <TrustBadges />
      <NewsletterStrip />
    </div>
  );
}
