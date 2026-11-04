import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/features/products/types';
import { useCategoryTop } from '@/features/products/hooks';
import { Price } from '@/shared/ui/Price';
import { Skeleton } from '@/shared/ui/Skeleton';
import { MENU_QUICK_LINKS } from './menuConfig';

/** Desktop hover panel for one category: description, quick filter links, and its top 3 bestsellers. */
export function MegaMenuPanel({ category, onNavigate }: { category: Category; onNavigate: () => void }) {
  const { data: top, isPending } = useCategoryTop(category.slug, true);
  const links = MENU_QUICK_LINKS[category.slug] ?? [];
  const base = `/collections/${category.slug}`;

  return (
    <div className="absolute inset-x-0 top-full animate-drop-in border-b border-line bg-white shadow-pop">
      <div className="container grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-12 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{category.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">{category.description}</p>
          <ul className="mt-5 space-y-2.5">
            {links.map((l) => (
              <li key={l.query}>
                <Link to={`${base}?${l.query}`} onClick={onNavigate} className="text-sm font-medium hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to={base}
            onClick={onNavigate}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:gap-2.5"
          >
            Shop all {category.name.toLowerCase()}
            <ArrowRight className="h-4 w-4 transition-all" />
          </Link>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Bestsellers</p>
          <ul className="mt-3 grid grid-cols-3 gap-5">
            {isPending
              ? Array.from({ length: 3 }, (_, i) => (
                  <li key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/3] w-full rounded-card" />
                    <Skeleton className="h-4 w-3/4" />
                  </li>
                ))
              : top?.map((p) => (
                  <li key={p._id}>
                    <Link to={`/products/${p.slug}`} onClick={onNavigate} className="group block">
                      <div className="aspect-[4/3] overflow-hidden rounded-card bg-surface-muted">
                        {p.images[0] && (
                          <img src={p.images[0].url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-brand">{p.name}</p>
                      <Price amount={p.minPrice} from={p.minPrice !== p.maxPrice} size="sm" className="mt-1" />
                    </Link>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
