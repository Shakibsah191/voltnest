import { HandCoins, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const BADGES = [
  { Icon: Truck, title: 'Delivery from ৳50', text: '৳50 in Rajshahi and Dhaka, ৳120 elsewhere' },
  { Icon: HandCoins, title: 'Cash on Delivery', text: 'Pay when it arrives, anywhere in Bangladesh' },
  { Icon: ShieldCheck, title: '18-month warranty', text: 'On every VoltNest product' },
  { Icon: RotateCcw, title: '7-day returns', text: 'Changed your mind? Send it back' },
];

export function TrustBadges() {
  return (
    <section aria-label="Why shop with VoltNest" className="rounded-card border border-line">
      <ul className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {BADGES.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-start gap-4 p-5 lg:p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-50">
              <Icon className="h-5 w-5 text-brand" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
