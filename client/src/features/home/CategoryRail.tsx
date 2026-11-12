import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '@/features/products/types';
import { categoryIcon } from '@/shared/lib/categoryIcons';
import { Skeleton } from '@/shared/ui/Skeleton';

/**
 * Photo for each category tile (served from client/public).
 * If a file is missing, the tile shows the category icon instead.
 * Hubs & Docks uses its first product photo once you add one.
 */
const CATEGORY_PHOTOS: Record<string, string> = {
  chargers: '/images/products/chargers/chargers-01.jpg',
  'power-banks': '/images/products/power-banks/power-banks-01.jpg',
  cables: '/images/products/cables/cables-01.jpg',
  'hubs-docks': '/images/products/hubs-docks/hubs-docks-01.jpg',
  audio: '/images/products/audio/audio-01.jpg',
};

export function CategoryRail({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  return (
    <section aria-labelledby="shop-by-category">
      <h2 id="shop-by-category" className="text-2xl font-bold">
        Shop by category
      </h2>
      <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-card" />
                <Skeleton className="mx-auto h-4 w-2/3" />
              </li>
            ))
          : categories.map((c) => {
              const Icon = categoryIcon(c.slug);
              const photo = CATEGORY_PHOTOS[c.slug];
              const showPhoto = Boolean(photo) && !failed[c.slug];
              return (
                <li key={c._id}>
                  <Link
                    to={`/collections/${c.slug}`}
                    className="group block overflow-hidden rounded-card bg-surface-muted transition-colors hover:bg-brand-50"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {showPhoto ? (
                        <img
                          src={photo}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={() => setFailed((f) => ({ ...f, [c.slug]: true }))}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-white shadow-card transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-14 sm:w-14">
                            <Icon className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="block px-2 py-3 text-center text-xs font-semibold sm:text-sm">{c.name}</span>
                  </Link>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
