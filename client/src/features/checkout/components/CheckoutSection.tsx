import type { ReactNode } from 'react';

/** One step of the checkout form. The steps are a real sequence, so they are numbered. */
export function CheckoutSection({ step, title, aside, children }: { step: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`checkout-step-${step}`} className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={`checkout-step-${step}`} className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-ink text-sm font-bold text-white" aria-hidden>
            {step}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
