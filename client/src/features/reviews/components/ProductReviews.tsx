import { BadgeCheck } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useProductReviews } from '../hooks';
import { Stars } from './Stars';

const reviewDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });

export function ProductReviews({ slug }: { slug: string }) {
  const query = useProductReviews(slug);

  if (query.isPending) return <Skeleton className="h-40 w-full rounded-card" />;
  if (query.isError) return <p className="text-sm text-ink-muted">Reviews didn’t load. Refresh the page to try again.</p>;

  const summary = query.data.pages[0]!.data.summary;
  const reviews = query.data.pages.flatMap((p) => p.data.items);

  if (summary.count === 0) {
    return (
      <div className="rounded-card border border-dashed border-line p-6 text-center">
        <p className="font-semibold">No reviews yet</p>
        <p className="mt-1 text-sm text-ink-muted">Bought this one? You can review it from My orders once it’s delivered.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <p className="text-5xl font-bold tabular-nums">{summary.average.toFixed(1)}</p>
        <Stars value={summary.average} size="md" className="mt-2" />
        <p className="mt-1 text-sm text-ink-muted">
          {summary.count} {summary.count === 1 ? 'review' : 'reviews'} from verified buyers
        </p>
        <ul className="mt-5 space-y-1.5">
          {(['5', '4', '3', '2', '1'] as const).map((n) => {
            const c = summary.distribution[n];
            return (
              <li key={n} className="flex items-center gap-3 text-sm">
                <span className="w-12 shrink-0 text-ink-muted">{n} star</span>
                <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
                  <span className="block h-full rounded-pill bg-ink" style={{ width: `${(c / summary.count) * 100}%` }} />
                </span>
                <span className="w-6 shrink-0 text-right tabular-nums text-ink-muted">{c}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <ul className="divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.id} className="py-5 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={r.rating} />
                {r.title && <p className="font-semibold">{r.title}</p>}
              </div>
              {r.body && <p className="mt-2 max-w-prose text-ink">{r.body}</p>}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
                <span>{r.authorName}</span>
                <span className="inline-flex items-center gap-1 text-success">
                  <BadgeCheck className="h-4 w-4" aria-hidden />
                  Verified purchase
                </span>
                <span>{reviewDate.format(new Date(r.createdAt))}</span>
              </p>
            </li>
          ))}
        </ul>
        {query.hasNextPage && (
          <Button variant="outline" className="mt-4" onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>
            Show more reviews
          </Button>
        )}
      </div>
    </div>
  );
}
