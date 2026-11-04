import { Link } from 'react-router-dom';
import type { Category } from '@/features/products/types';
import { categoryIcon } from '@/shared/lib/categoryIcons';
import { Skeleton } from '@/shared/ui/Skeleton';

export function CategoryRail({ categories, loading }: { categories: Category[]; loading: boolean }) {
  return (
    <section aria-labelledby="shop-by-category">
      <h2 id="shop-by-category" className="text-2xl font-bold">
        Shop by category
      </h2>
      <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-square w-full rounded-card md:aspect-auto md:h-36" />
              </li>
            ))
          : categories.map((c) => {
              const Icon = categoryIcon(c.slug);
              return (
                <li key={c._id}>
                  <Link
                    to={`/collections/${c.slug}`}
                    className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-card bg-surface-muted p-3 text-center transition-colors hover:bg-brand-50 md:aspect-auto md:py-7"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-white shadow-card transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-14 sm:w-14">
                      <Icon className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
                    </span>
                    <span className="text-xs font-semibold sm:text-sm">{c.name}</span>
                  </Link>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
