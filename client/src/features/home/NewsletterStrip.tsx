import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Form only for now. Saving subscribers is added after launch. */
export function NewsletterStrip() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'done'>('idle');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus(EMAIL_RE.test(email.trim()) ? 'done' : 'error');
  };

  return (
    <section aria-labelledby="newsletter-title" className="rounded-card bg-brand-50 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14">
      <div className="max-w-md">
        <h2 id="newsletter-title" className="text-2xl font-bold">
          Hear about new gear first
        </h2>
        <p className="mt-2 text-ink-muted">One email a month with new arrivals and member-only prices. No spam.</p>
      </div>

      <div className="mt-6 w-full max-w-md lg:mt-0" aria-live="polite">
        {status === 'done' ? (
          <p className="flex items-center gap-2 font-medium text-success">
            <Check className="h-5 w-5" aria-hidden />
            Thanks, you’re on the list.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder="you@example.com"
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
              className="h-12 flex-1 rounded-pill border border-line bg-white px-5 text-sm focus:border-brand focus:outline-none aria-[invalid=true]:border-sale"
            />
            <Button type="submit" size="lg">
              Subscribe
            </Button>
          </form>
        )}
        {status === 'error' && (
          <p id="newsletter-error" className="mt-2 text-sm text-sale">
            Enter a full email address, like name@example.com.
          </p>
        )}
      </div>
    </section>
  );
}
