import type { ReactNode } from 'react';

/** The shared frame for the log in and create account pages. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="container flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div>
      </div>
    </div>
  );
}
