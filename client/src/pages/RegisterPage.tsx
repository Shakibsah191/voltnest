import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { safeNext, useRegister } from '@/features/auth/hooks';
import { AuthCard } from '@/features/auth/AuthCard';
import { PasswordToggle } from '@/features/auth/PasswordToggle';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { isValidBdPhone, isValidEmail } from '@/shared/lib/validation';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function RegisterPage() {
  useDocumentTitle('Create an account');
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const status = useAuthStore((s) => s.status);
  const register = useRegister();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (status === 'authenticated') return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = 'Enter your full name';
    if (!isValidEmail(form.email)) found.email = 'Enter a valid email address';
    if (form.phone.trim() && !isValidBdPhone(form.phone)) found.phone = 'Enter a valid Bangladeshi mobile number, like 01712345678';
    if (form.password.length < 8) found.password = 'Use at least 8 characters';
    setErrors(found);
    if (Object.keys(found).length) return;
    register.mutate(
      { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, password: form.password },
      { onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors) },
    );
  };

  const showBanner = register.isError && !(register.error instanceof ApiError && Object.keys(register.error.fieldErrors).length);
  const loginLink = `/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <AuthCard
      title="Create an account"
      subtitle="Check out faster and keep your cart on every device."
      footer={
        <>
          Already have an account?{' '}
          <Link to={loginLink} className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        {showBanner && <Alert tone="error">{register.error.message}</Alert>}
        <TextField id="reg-name" label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} autoFocus />
        <TextField id="reg-email" label="Email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <TextField
          id="reg-phone"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01712345678"
          optional
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          hint="We use it to fill in checkout for you."
        />
        <TextField
          id="reg-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters."
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />
        <Button type="submit" size="lg" fullWidth loading={register.isPending}>
          {register.isPending ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
