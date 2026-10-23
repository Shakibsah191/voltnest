import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { ProductSummary } from '@/features/products/types';
import { cn, discountPercent } from '@/shared/lib/utils';
import { Badge } from './Badge';
import { Price } from './Price';

const NEW_FOR_DAYS = 30;
const BESTSELLER_FROM = 600;

/** e.g. "65W, 3 ports" or "20,000 mAh, 22.5W" — the numbers people compare. */
function keySpecs(p: ProductSummary) {
  const o = p.variants[0]?.options ?? {};
  const parts: string[] = [];
  if (o.capacity) parts.push(`${o.capacity.toLocaleString('en-US')} mAh`);
  if (o.wattage) parts.push(`${o.wattage}W`);
  if (o.ports && o.ports > 1) parts.push(`${o.ports} ports`);
  if (o.length && !o.capacity) parts.push(`${p.variants.length > 1 ? 'from ' : ''}${o.length} m`);
  return parts.join(', ');
}

export function ProductCard({ product, className }: { product: ProductSummary; className?: string }) {
  const cheapest = product.variants.reduce((a, b) => (b.price < a.price ? b : a), product.variants[0]);
  const off = discountPercent(cheapest.price, cheapest.compareAtPrice);
  const isNew = Date.now() - new Date(product.publishedAt).getTime() < NEW_FOR_DAYS * 86_400_000;
  const isBestseller = product.salesCount >= BESTSELLER_FROM;
  const soldOut = product.totalStock === 0;
  const colours = new Set(product.variants.map((v) => v.options.color).filter(Boolean)).size;
  const [primary, secondary] = product.images;
  const specs = keySpecs(product);

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <Link
        to={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-card bg-surface-muted"
      >
        {primary && (
          <img
            src={primary.url}
            alt={primary.alt || product.name}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              secondary && 'group-hover:opacity-0',
            )}
          />
        )}
        {secondary && (
          <img
            src={secondary.url}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <Badge tone="neutral">Sold out</Badge>
          ) : off > 0 ? (
            <Badge tone="sale">−{off}%</Badge>
          ) : null}
          {isNew && <Badge tone="new">New</Badge>}
          {!isNew && isBestseller && <Badge tone="bestseller">Bestseller</Badge>}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <Link to={`/products/${product.slug}`} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>

        {specs && <p className="text-xs text-ink-muted">{specs}</p>}

        {product.ratingCount > 0 && (
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Star aria-hidden className="h-3.5 w-3.5 fill-ink text-ink" />
            <span className="font-medium text-ink">{product.ratingAvg.toFixed(1)}</span>
            <span>({product.ratingCount})</span>
          </p>
        )}

        <div className="mt-auto pt-1">
          <Price
            amount={cheapest.price}
            compareAt={cheapest.compareAtPrice}
            from={product.minPrice !== product.maxPrice}
            size="sm"
          />
          {colours > 1 && <p className="mt-0.5 text-xs text-ink-muted">{colours} colours</p>}
        </div>
      </div>
    </article>
  );
}
