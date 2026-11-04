import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ProductSummary } from '@/features/products/types';
import { ProductCard } from '@/shared/ui/ProductCard';
import { ProductCardSkeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/lib/utils';

interface ShelfTabsProps {
  newArrivals: ProductSummary[];
  bestsellers: ProductSummary[];
  loading: boolean;
}

const TABS = [
  { id: 'new', label: 'New arrivals', link: '/collections/all?sort=newest' },
  { id: 'best', label: 'Bestsellers', link: '/collections/all?sort=bestselling' },
] as const;

export function ShelfTabs({ newArrivals, bestsellers, loading }: ShelfTabsProps) {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('new');
  const products = active === 'new' ? newArrivals : bestsellers;
  const tab = TABS.find((t) => t.id === active)!;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      setActive((a) => (a === 'new' ? 'best' : 'new'));
    }
  };

  return (
    <section aria-label="Product shelf">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="tablist" aria-label="Product shelf" className="flex gap-6" onKeyDown={onKeyDown}>
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active === t.id}
              aria-controls="shelf-panel"
              tabIndex={active === t.id ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={cn(
                'relative pb-2 text-xl font-bold transition-colors sm:text-2xl',
                active === t.id
                  ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-ink'
                  : 'text-ink-subtle hover:text-ink-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link to={tab.link} className="inline-flex items-center gap-1.5 pb-2 text-sm font-semibold text-brand hover:gap-2.5">
          Shop all
          <ArrowRight className="h-4 w-4 transition-all" />
        </Link>
      </div>

      <div id="shelf-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-6">
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-x-6">
          {(loading ? Array.from({ length: 8 }) : products).map((p, i) => (
            <li key={loading ? i : (p as ProductSummary)._id} className="w-[44%] shrink-0 snap-start sm:w-auto">
              {loading ? <ProductCardSkeleton /> : <ProductCard product={p as ProductSummary} />}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
