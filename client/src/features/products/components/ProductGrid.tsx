import type { ProductSummary } from '../types';
import { ProductCard } from '@/shared/ui/ProductCard';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';

interface ProductGridProps {
  products: ProductSummary[];
  loading?: boolean;
  skeletonCount?: number;
  columns?: 'default' | 'narrow';
  className?: string;
}

export function ProductGrid({ products, loading, skeletonCount = 8, columns = 'default', className }: ProductGridProps) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-10 lg:gap-x-6',
        columns === 'default' ? 'sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-2 md:grid-cols-3',
        className,
      )}
    >
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))
        : products.map((p) => (
            <li key={p._id}>
              <ProductCard product={p} />
            </li>
          ))}
    </ul>
  );
}

interface LoadMoreProps {
  shown: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export function LoadMore({ shown, total, hasMore, loading, onLoadMore }: LoadMoreProps) {
  if (total === 0) return null;
  return (
    <div className="mt-12 flex flex-col items-center gap-3">
      <p className="text-sm text-ink-muted">
        Showing {shown} of {total}
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
        <div className="h-full rounded-pill bg-ink" style={{ width: `${Math.min(100, (shown / total) * 100)}%` }} />
      </div>
      {hasMore && (
        <Button variant="outline" loading={loading} onClick={onLoadMore} className="mt-2">
          Load more
        </Button>
      )}
    </div>
  );
}
