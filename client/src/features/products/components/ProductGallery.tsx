import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { ProductImage } from '../types';
import { cn } from '@/shared/lib/utils';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const dragStart = useRef<number | null>(null);
  const count = images.length;

  // a new variant image changes the list, so start from the first image again
  useEffect(() => setIndex(0), [images]);

  const go = (i: number) => setIndex(((i % count) + count) % count);

  const onPointerUp = (e: PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) > 40 && count > 1) go(index + (dx < 0 ? 1 : -1));
  };

  if (!count) return <div className="aspect-square rounded-card bg-surface-muted" />;

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
      <div
        className="relative aspect-square flex-1 touch-pan-y overflow-hidden rounded-card bg-surface-muted"
        onPointerDown={(e) => (dragStart.current = e.clientX)}
        onPointerUp={onPointerUp}
      >
        <img
          key={images[index].url}
          src={images[index].url}
          alt={images[index].alt || name}
          className="h-full w-full animate-fade-in object-cover"
          draggable={false}
        />
        {count > 1 && (
          <p className="absolute bottom-3 right-3 rounded-pill bg-white/90 px-2.5 py-1 text-xs font-medium tabular-nums md:hidden">
            {index + 1} / {count}
          </p>
        )}
      </div>

      {count > 1 && (
        <ul className="flex gap-2 md:w-20 md:flex-col" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn(
                  'block h-16 w-16 overflow-hidden rounded-md border-2 bg-surface-muted md:h-20 md:w-20',
                  i === index ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
