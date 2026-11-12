import { useState, type FormEvent } from 'react';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextAreaField, TextField } from '@/shared/ui/TextField';
import type { OrderStatus } from '@/features/orders/types';
import { useUpdateOrderStatus } from '../hooks';
import type { AdminOrder } from '../types';

/** What each button says and what it asks for. */
const ACTIONS: Partial<Record<OrderStatus, { label: string; help: string; tone: 'primary' | 'outline' | 'danger'; needs?: 'courier' | 'reason' }>> = {
  confirmed: { label: 'Confirm order', help: 'Call the customer first to make sure the order is real. They get a “confirmed” email.', tone: 'primary' },
  processing: { label: 'Mark as packing', help: 'Optional step while you pack it. The customer isn’t emailed.', tone: 'outline' },
  shipped: { label: 'Mark as shipped', help: 'Hand it to the courier, then enter their details. The customer gets an “on the way” email.', tone: 'primary', needs: 'courier' },
  delivered: { label: 'Mark delivered', help: 'The customer paid and has the parcel. They get a “delivered” email and can review it.', tone: 'primary' },
  cancelled: { label: 'Cancel order', help: 'The stock goes back on sale and the customer gets a “cancelled” email.', tone: 'danger', needs: 'reason' },
  returned: { label: 'Mark returned', help: 'The customer sent it back.', tone: 'outline', needs: 'reason' },
};

/** The main forward step first, so the obvious button is the first one. */
const ORDER: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'processing', 'returned', 'cancelled'];

export function StatusActions({ order }: { order: AdminOrder }) {
  const [open, setOpen] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState(order.courier?.name ?? '');
  const [tracking, setTracking] = useState(order.courier?.trackingNumber ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = useUpdateOrderStatus(order.orderNumber);

  const choices = ORDER.filter((s) => order.nextStatuses.includes(s) && ACTIONS[s]);
  // when a bigger step is possible, hide the optional "packing" button unless it's the natural next one
  const primary = choices.filter((s) => s !== 'processing' || order.status === 'confirmed');

  if (primary.length === 0) {
    return <p className="text-sm text-ink-muted">This order is finished. Nothing more to do.</p>;
  }

  const action = open ? ACTIONS[open]! : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!open || !action) return;
    const found: Record<string, string> = {};
    if (action.needs === 'courier' && courier.trim().length < 2) found['courier.name'] = 'Enter the courier’s name';
    if (action.needs === 'reason' && note.trim().length < 3) found.note = 'Write a short reason. The customer sees it.';
    setErrors(found);
    if (Object.keys(found).length) return;
    update.mutate(
      {
        status: open,
        note: note.trim() || undefined,
        courier: action.needs === 'courier' ? { name: courier.trim(), trackingNumber: tracking.trim() } : undefined,
      },
      {
        onSuccess: () => {
          setOpen(null);
          setNote('');
        },
        onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors),
      },
    );
  };

  return (
    <div>
      {!open && (
        <div className="flex flex-wrap gap-2">
          {primary.map((s) => (
            <Button key={s} variant={ACTIONS[s]!.tone} onClick={() => (setOpen(s), setErrors({}), update.reset())}>
              {ACTIONS[s]!.label}
            </Button>
          ))}
        </div>
      )}

      {open && action && (
        <form noValidate onSubmit={submit} className="space-y-4">
          <p className="text-sm text-ink-muted">{action.help}</p>
          {update.isError && !Object.keys(errors).length && <Alert tone="error">{update.error.message}</Alert>}
          {action.needs === 'courier' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="courier-name" label="Courier" placeholder="Pathao, Steadfast, RedX…" value={courier} onChange={(e) => setCourier(e.target.value)} error={errors['courier.name']} autoFocus />
              <TextField id="courier-tracking" label="Tracking number" optional value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
          )}
          <TextAreaField
            id="status-note"
            label={action.needs === 'reason' ? 'Reason' : 'Note for the customer'}
            optional={action.needs !== 'reason'}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={errors.note}
            hint="Shows in the customer’s order history and email."
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant={action.tone === 'outline' ? 'primary' : action.tone} loading={update.isPending}>
              {action.label}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(null)} disabled={update.isPending}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
