import { Link } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';
import type { Category } from '@/features/products/types';
import { categoryIcon } from '@/shared/lib/categoryIcons';
import { Drawer } from '@/shared/ui/Drawer';
import { Logo } from './Logo';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function MobileMenu({ open, onClose, categories }: MobileMenuProps) {
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu" hideTitle headerStart={<Logo onClick={onClose} />}>
      <nav aria-label="Mobile" className="px-5 pb-8">
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">Shop</p>
        <ul className="mt-2 divide-y divide-line">
          {categories.map((c) => {
            const Icon = categoryIcon(c.slug);
            return (
              <li key={c._id}>
                <Link to={`/collections/${c.slug}`} onClick={onClose} className="flex items-center gap-3 py-4 text-base font-medium">
                  <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-surface-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  {c.name}
                  <ChevronRight className="ml-auto h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            );
          })}
          <li>
            <Link to="/collections/all" onClick={onClose} className="flex items-center py-4 text-base font-medium text-brand">
              Shop all products
              <ChevronRight className="ml-auto h-4 w-4" />
            </Link>
          </li>
        </ul>

        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-subtle">Help</p>
        <ul className="mt-2 space-y-3 text-sm text-ink-muted">
          <li><Link to="/pages/shipping" onClick={onClose}>Shipping and delivery</Link></li>
          <li><Link to="/pages/returns" onClick={onClose}>Returns and refunds</Link></li>
          <li><Link to="/pages/contact" onClick={onClose}>Contact us</Link></li>
        </ul>

        <Link
          to="/account"
          onClick={onClose}
          className="mt-8 flex items-center gap-3 rounded-card bg-surface-muted p-4 text-sm font-medium"
        >
          <User className="h-5 w-5" />
          Sign in or create an account
        </Link>
      </nav>
    </Drawer>
  );
}
