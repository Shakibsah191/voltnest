import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { safeNext, useLogin } from '@/features/auth/hooks';
import { AuthCard } from '@/features/auth/AuthCard';
import { PasswordToggle } from '@/features/auth/PasswordToggle';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { isValidEmail } from '@/shared/lib/validation';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Log in');
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const status = useAuthStore((s) => s.status);
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // logged in (already, or just now) → go where they were heading
  if (status === 'authenticated') return <Navigate to={next} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!isValidEmail(email)) found.email = 'Enter a valid email address';
    if (!password) found.password = 'Enter your password';
    setErrors(found);
    if (Object.keys(found).length) return;
    login.mutate(
      { email: email.trim(), password },
      { onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors) },
    );
  };

  const showBanner = login.isError && !(login.error instanceof ApiError && Object.keys(login.error.fieldErrors).length);
  const registerLink = `/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <AuthCard
      title="Log in"
      subtitle={next === '/checkout' ? 'Log in to check out faster. Your cart comes with you.' : 'Welcome back to VoltNest.'}
      footer={
        <>
          New to VoltNest?{' '}
          <Link to={registerLink} className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        {showBanner && <Alert tone="error">{login.error.message}</Alert>}
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus
        />
        <TextField
          id="login-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />
        <Button type="submit" size="lg" fullWidth loading={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>
        {next === '/checkout' && (
          <p className="text-center text-sm">
            <Link to="/checkout" className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Continue as a guest instead
            </Link>
          </p>
        )}
      </form>
    </AuthCard>
  );
}
