import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Check, HandCoins, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useProduct } from '@/features/products/hooks';
import { ProductGallery } from '@/features/products/components/ProductGallery';
import { VariantPicker } from '@/features/products/components/VariantPicker';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { MAX_PER_LINE } from '@/features/cart/cart.store';
import { useAddToCart } from '@/features/cart/hooks';
import { useCheckoutOptions } from '@/features/checkout/hooks';
import { useProductReviews } from '@/features/reviews/hooks';
import { ProductReviews } from '@/features/reviews/components/ProductReviews';
import { Stars } from '@/features/reviews/components/Stars';
import { ApiError } from '@/shared/api-client';
import { Badge } from '@/shared/ui/Badge';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { Price } from '@/shared/ui/Price';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { cn, discountPercent, formatBDT } from '@/shared/lib/utils';
import { NotFoundPage } from './NotFoundPage';

const LOW_STOCK = 10;

function StockMessage({ stock }: { stock: number }) {
  if (stock === 0) return <p className="flex items-center gap-2 text-sm font-medium text-sale"><span className="h-2 w-2 rounded-pill bg-sale" />Sold out</p>;
  if (stock <= LOW_STOCK)
    return <p className="flex items-center gap-2 text-sm font-medium text-warning"><span className="h-2 w-2 rounded-pill bg-warning" />Only {stock} left in stock</p>;
  return <p className="flex items-center gap-2 text-sm font-medium text-success"><span className="h-2 w-2 rounded-pill bg-success" />In stock, ready to ship</p>;
}

function DeliveryLine() {
  const { data } = useCheckoutOptions();
  if (!data) return <span>Delivery anywhere in Bangladesh.</span>;
  return (
    <span>
      {data.zones.map((z) => `${z.label}: ${z.minDays} to ${z.maxDays} days, ${formatBDT(z.charge)}.`).join(' ')}
    </span>
  );
}

/** Real reviews only (the summary comes from the same request as the reviews list below). */
function RatingLine({ slug }: { slug: string }) {
  const summary = useProductReviews(slug).data?.pages[0]?.data.summary;
  if (!summary || summary.count === 0) return null;
  return (
    <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
      <Stars value={summary.average} />
      <span className="font-semibold text-ink">{summary.average.toFixed(1)}</span>
      <span className="underline-offset-2 hover:underline">
        {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
      </span>
    </a>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="container grid gap-10 py-8 lg:grid-cols-2 lg:py-10">
      <Skeleton className="aspect-square w-full rounded-card" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full rounded-pill" />
      </div>
    </div>
  );
}

export function ProductPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { data, isPending, isError, error, refetch } = useProduct(slug);
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);

  const product = data?.product;
  const variantSku = params.get('variant');

  // the variant in the URL, else the first one in stock, else the first one
  const selected = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) => v.sku === variantSku) ??
      product.variants.find((v) => v.stock > 0) ??
      product.variants[0]
    );
  }, [product, variantSku]);

  useEffect(() => {
    setQuantity(1);
    addToCart.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.sku]);
  useDocumentTitle(product?.name);

  const images = useMemo(() => {
    if (!product) return [];
    return selected?.image ? [{ url: selected.image, alt: `${product.name}, ${selected.name}` }, ...product.images] : product.images;
  }, [product, selected]);

  if (isPending) return <ProductPageSkeleton />;
  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
    return (
      <div className="container py-20 text-center">
        <h1 className="text-xl font-semibold">This product didn’t load</h1>
        <p className="mt-2 text-ink-muted">{error.message}</p>
        <Button className="mt-6" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }
  if (!product || !selected) return <NotFoundPage />;

  const category = product.categoryIds[0];
  const off = discountPercent(selected.price, selected.compareAtPrice);
  const maxQty = Math.min(selected.stock, MAX_PER_LINE);

  const selectVariant = (sku: string) => {
    const next = new URLSearchParams(params);
    next.set('variant', sku);
    setParams(next, { replace: true });
  };

  const add = () => addToCart.mutate({ sku: selected.sku, quantity });

  return (
    <div className="container py-6 lg:py-10">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          ...(category ? [{ label: category.name, to: `/collections/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={images} name={product.name} />

        <div className="lg:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {off > 0 && <Badge tone="sale">Save {off}%</Badge>}
            {product.salesCount >= 600 && <Badge tone="bestseller">Bestseller</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <RatingLine slug={product.slug} />
          <p className="mt-3 text-ink-muted">{product.shortDescription}</p>

          <Price amount={selected.price} compareAt={selected.compareAtPrice} size="lg" className="mt-6" />

          <div className="mt-6 space-y-6">
            <VariantPicker variants={product.variants} selected={selected} onSelect={selectVariant} />
            <StockMessage stock={selected.stock} />

            <div className="flex flex-wrap gap-3">
              {selected.stock > 0 && <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} />}
              <Button
                size="lg"
                className="min-w-[12rem] flex-1"
                onClick={add}
                disabled={selected.stock === 0}
                loading={addToCart.isPending}
              >
                {!addToCart.isPending && <ShoppingBag className="h-5 w-5" />}
                {selected.stock === 0 ? 'Sold out' : addToCart.isPending ? 'Adding…' : 'Add to cart'}
              </Button>
            </div>
            {addToCart.isError && (
              <p role="alert" className="text-sm text-sale">
                {addToCart.error.message}
              </p>
            )}
          </div>

          <ul className="mt-8 space-y-3 rounded-card bg-surface-muted p-5 text-sm">
            <li className="flex gap-3">
              <Truck className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              <DeliveryLine />
            </li>
            <li className="flex gap-3">
              <HandCoins className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span>Cash on Delivery available anywhere in Bangladesh.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span>18-month warranty and 7-day returns.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16 grid gap-12 border-t border-line pt-12 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="about-title">
          <h2 id="about-title" className="text-xl font-bold">About this product</h2>
          <ul className="mt-5 space-y-3">
            {product.highlights.map((h) => (
              <li key={h} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                <span>{h}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-prose text-ink-muted">{product.description}</p>
        </section>

        <section aria-labelledby="specs-title">
          <h2 id="specs-title" className="text-xl font-bold">Specifications</h2>
          <dl className="mt-5 divide-y divide-line rounded-card border border-line">
            {product.specs.map((s, i) => (
              <div key={s.label} className={cn('grid grid-cols-[40%_1fr] gap-4 px-5 py-3.5 text-sm', i % 2 === 1 && 'bg-surface-muted/60')}>
                <dt className="text-ink-muted">{s.label}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[40%_1fr] gap-4 px-5 py-3.5 text-sm">
              <dt className="text-ink-muted">SKU</dt>
              <dd className="font-medium tabular-nums">{selected.sku}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section id="reviews" aria-labelledby="reviews-title" className="mt-16 scroll-mt-24 border-t border-line pt-12">
        <h2 id="reviews-title" className="mb-6 text-2xl font-bold">
          Customer reviews
        </h2>
        <ProductReviews slug={product.slug} />
      </section>

      {data.related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16">
          <h2 id="related-title" className="text-2xl font-bold">You may also like</h2>
          <ProductGrid products={data.related} className="mt-6" />
        </section>
      )}
    </div>
  );
}
