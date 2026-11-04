import { useCallback, useEffect, useRef, useState, type ComponentType, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonClasses } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';
import { ChargerArt, EarbudsArt, PowerBankArt } from './HeroArt';

interface Slide {
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; to: string };
  secondary: { label: string; to: string };
  theme: 'blue' | 'dark' | 'sand';
  Art: ComponentType;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'VoltNest Vertex 65W',
    title: 'One charger for your laptop, phone and watch',
    text: '65W of GaN power from a body smaller than a deck of cards.',
    cta: { label: 'Shop chargers', to: '/collections/chargers' },
    secondary: { label: 'See the Vertex 65W', to: '/products/voltnest-vertex-65w-3-port-gan-charger' },
    theme: 'blue',
    Art: ChargerArt,
  },
  {
    eyebrow: 'VoltNest Flux 20000',
    title: 'Keep everything running through power cuts',
    text: 'Four full phone charges in one battery, with three ports to share.',
    cta: { label: 'Shop power banks', to: '/collections/power-banks' },
    secondary: { label: 'See the Flux 20000', to: '/products/voltnest-flux-20000-power-bank' },
    theme: 'dark',
    Art: PowerBankArt,
  },
  {
    eyebrow: 'VoltNest Echo Buds Pro',
    title: 'Quiet the commute',
    text: 'Adaptive noise cancelling and 36 hours of battery with the case.',
    cta: { label: 'Shop audio', to: '/collections/audio' },
    secondary: { label: 'See the Echo Buds Pro', to: '/products/voltnest-echo-buds-pro-anc-earbuds' },
    theme: 'sand',
    Art: EarbudsArt,
  },
];

const THEMES = {
  blue: { bg: 'bg-brand-800', text: 'text-white', muted: 'text-brand-100', eyebrow: 'text-brand-200', art: 'text-brand-200', light: true },
  dark: { bg: 'bg-ink', text: 'text-white', muted: 'text-white/70', eyebrow: 'text-[#F5B544]', art: 'text-white', light: true },
  sand: { bg: 'bg-[#EFE6DA]', text: 'text-ink', muted: 'text-ink-muted', eyebrow: 'text-ink-muted', art: 'text-ink', light: false },
};

const AUTOPLAY_MS = 6000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragStart = useRef<number | null>(null);
  const count = SLIDES.length;

  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduceMotion) return;
    const id = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured products"
      className="relative overflow-hidden rounded-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="flex touch-pan-y transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {SLIDES.map((s, i) => {
          const t = THEMES[s.theme];
          const active = i === index;
          return (
            <div
              key={s.eyebrow}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={cn('w-full shrink-0', t.bg, t.text)}
            >
              <div className="grid min-h-[30rem] items-center gap-6 px-6 pb-20 pt-10 sm:px-10 md:min-h-[26rem] md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-14 lg:px-16">
                <div className="max-w-xl">
                  <p className={cn('text-sm font-semibold', t.eyebrow)}>{s.eyebrow}</p>
                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">{s.title}</h2>
                  <p className={cn('mt-4 max-w-md text-base sm:text-lg', t.muted)}>{s.text}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link
                      to={s.cta.to}
                      tabIndex={active ? 0 : -1}
                      className={buttonClasses(t.light ? 'outline' : 'secondary', 'lg', t.light ? 'border-white bg-white text-ink hover:border-white hover:bg-white/90' : '')}
                    >
                      {s.cta.label}
                    </Link>
                    <Link
                      to={s.secondary.to}
                      tabIndex={active ? 0 : -1}
                      className="text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {s.secondary.label}
                    </Link>
                  </div>
                </div>
                <div className={cn('mx-auto h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80', t.art)}>
                  <s.Art />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(() => {
        const light = THEMES[SLIDES[index].theme].light;
        return (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 pb-6 sm:px-10 lg:px-16">
            <div className="flex items-center gap-2">
              {SLIDES.map((s, i) => (
                <button
                  key={s.eyebrow}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
                  aria-current={i === index}
                  className={cn(
                    'h-1.5 rounded-pill transition-all duration-300',
                    i === index ? 'w-8' : 'w-3',
                    light ? (i === index ? 'bg-white' : 'bg-white/40') : i === index ? 'bg-ink' : 'bg-ink/25',
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Previous slide', Icon: ChevronLeft, to: index - 1 },
                { label: 'Next slide', Icon: ChevronRight, to: index + 1 },
              ].map(({ label, Icon, to }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => go(to)}
                  aria-label={label}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-pill border transition-colors',
                    light ? 'border-white/30 text-white hover:bg-white/10' : 'border-ink/20 text-ink hover:bg-ink/5',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
