import { Link } from 'react-router-dom';
import { useCategories } from '@/features/products/hooks';
import { Logo } from './Logo';

const HELP_LINKS = [
  { label: 'Track your order', to: '/account/orders' },
  { label: 'Shipping and delivery', to: '/pages/shipping' },
  { label: 'Returns and refunds', to: '/pages/returns' },
  { label: 'Warranty', to: '/pages/warranty' },
  { label: 'Contact us', to: '/pages/contact' },
];

const COMPANY_LINKS = [
  { label: 'About VoltNest', to: '/pages/about' },
  { label: 'Privacy policy', to: '/pages/privacy' },
  { label: 'Terms of service', to: '/pages/terms' },
];

const PAYMENT_METHODS = ['Cash on Delivery', 'bKash', 'Nagad', 'Visa', 'Mastercard'];

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-ink-muted hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { data: categories = [] } = useCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-section border-t border-line bg-surface-muted">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-ink-muted">
            Chargers, power banks, cables and audio gear, delivered to your door anywhere in Bangladesh.
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            Support: <a href="mailto:support@voltnest.test" className="text-ink hover:text-brand">support@voltnest.test</a>
            <br />
            Saturday to Thursday, 10 am to 8 pm
          </p>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            ...categories.map((c) => ({ label: c.name, to: `/collections/${c.slug}` })),
            { label: 'All products', to: '/collections/all' },
          ]}
        />
        <FooterColumn title="Help" links={HELP_LINKS} />
        <FooterColumn title="Company" links={COMPANY_LINKS} />
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col gap-4 py-6 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} VoltNest. All rights reserved.</p>
          <ul className="flex flex-wrap gap-2" aria-label="Payment methods we accept">
            {PAYMENT_METHODS.map((m) => (
              <li key={m} className="rounded-md border border-line bg-white px-2 py-1 font-medium text-ink">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
