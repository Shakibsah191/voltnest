import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useCreateStaff, useIsOwner, useStaff, useUpdateStaff } from '@/features/admin/hooks';
import { AdminPageHeader, Panel } from '@/features/admin/components/AdminPageHeader';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { TextField } from '@/shared/ui/TextField';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const lastSeen = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' });

function PasswordReset({ id, onDone }: { id: string; onDone: () => void }) {
  const [pw, setPw] = useState('');
  const update = useUpdateStaff();
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (pw.length >= 8) update.mutate({ id, password: pw }, { onSuccess: onDone });
      }}
    >
      <TextField id={`pw-${id}`} label="New password" type="text" value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 8 characters. They’ll be logged out." wrapperClassName="min-w-[14rem] flex-1" />
      <Button type="submit" size="sm" disabled={pw.length < 8} loading={update.isPending} className="mb-6">
        Set password
      </Button>
    </form>
  );
}

export function AdminStaffPage() {
  useDocumentTitle('Staff');
  const isOwner = useIsOwner();
  const { data, isPending } = useStaff();
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState<string | null>(null);
  const [added, setAdded] = useState('');

  if (!isOwner) return <Navigate to="/admin" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setAdded('');
    create.mutate(form, {
      onSuccess: () => {
        setAdded(`${form.name} can now log in with ${form.email}. Give them the password in person.`);
        setForm({ name: '', email: '', password: '' });
        setErrors({});
      },
      onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors),
    });
  };

  return (
    <>
      <AdminPageHeader title="Staff" subtitle="Employees can confirm, ship and deliver orders and update stock. They can’t see costs, profit or change prices." />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Accounts">
          {isPending ? (
            <Skeleton className="h-32" />
          ) : (
            <ul className="divide-y divide-line">
              {data?.map((u) => (
                <li key={u.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{u.name}</span>
                        <Badge tone={u.role === 'admin' ? 'bestseller' : 'neutral'}>{u.role === 'admin' ? 'Owner' : 'Staff'}</Badge>
                        {!u.isActive && <Badge tone="sale">Switched off</Badge>}
                      </span>
                      <span className="block text-sm text-ink-muted">{u.email}</span>
                      <span className="block text-xs text-ink-subtle">{u.lastLoginAt ? `Last login ${lastSeen.format(new Date(u.lastLoginAt))}` : 'Never logged in'}</span>
                    </span>
                    {u.role === 'staff' && (
                      <span className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setResetting(resetting === u.id ? null : u.id)}>
                          New password
                        </Button>
                        <Button
                          size="sm"
                          variant={u.isActive ? 'outline' : 'primary'}
                          loading={update.isPending && update.variables?.id === u.id}
                          onClick={() => update.mutate({ id: u.id, isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Switch off' : 'Switch on'}
                        </Button>
                      </span>
                    )}
                  </div>
                  {resetting === u.id && <PasswordReset id={u.id} onDone={() => setResetting(null)} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Add an employee">
          <form noValidate onSubmit={submit} className="space-y-4">
            {added && <Alert tone="success">{added}</Alert>}
            {create.isError && !Object.keys(errors).length && <Alert tone="error">{create.error.message}</Alert>}
            <TextField id="s-name" label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
            <TextField id="s-email" label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} hint="They log in with this." />
            <TextField
              id="s-password"
              label="Starting password"
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={errors.password}
              hint="At least 8 characters."
            />
            <Button type="submit" fullWidth loading={create.isPending}>
              Add employee
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
