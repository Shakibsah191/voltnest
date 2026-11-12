import { Link, useParams } from 'react-router-dom';
import { POLICIES } from '@/content/policies';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { NotFoundPage } from './NotFoundPage';

const LINKS = [
  ['shipping', 'Shipping and delivery'],
  ['returns', 'Returns and refunds'],
  ['warranty', 'Warranty'],
  ['contact', 'Contact us'],
  ['privacy', 'Privacy policy'],
  ['terms', 'Terms of service'],
] as const;

/** Shipping, returns, warranty, contact, about, privacy and terms: one page, content from content/policies.ts. */
export function PolicyPage() {
  const { slug = '' } = useParams();
  const page = POLICIES[slug];
  useDocumentTitle(page?.title);
  if (!page) return <NotFoundPage />;

  return (
    <div className="container py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: page.title }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Help pages" className="order-last lg:order-first">
          <ul className="space-y-1 text-sm">
            {LINKS.map(([s, label]) => (
              <li key={s}>
                <Link
                  to={`/pages/${s}`}
                  aria-current={s === slug ? 'page' : undefined}
                  className={s === slug ? 'block rounded-md bg-surface-muted px-3 py-2 font-medium' : 'block rounded-md px-3 py-2 text-ink-muted hover:text-ink'}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-prose">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          <p className="mt-3 text-lg text-ink-muted">{page.intro}</p>
          {page.sections.map((s) => (
            <section key={s.heading} className="mt-8">
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              <ul className="mt-3 space-y-2">
                {s.body.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
