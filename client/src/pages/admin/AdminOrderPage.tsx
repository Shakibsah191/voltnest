import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import { useAdminOrder, useEditOrder, useIsOwner } from '@/features/admin/hooks';
import { AdminPageHeader, Panel } from '@/features/admin/components/AdminPageHeader';
import { StatusActions } from '@/features/admin/components/StatusActions';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { STATUS_LABEL } from '@/features/orders/status';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatBDT } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' });
const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });
const toYmd = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600e3).toISOString().slice(0, 10);

function DueDate({ orderNumber, iso, editable }: { orderNumber: string; iso: string; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(toYmd(iso));
  const edit = useEditOrder(orderNumber);
  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        <span className="font-medium">{day.format(new Date(iso))}</span>
        {editable && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-brand hover:underline">
            Change
          </button>
        )}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input type="date" value={value} onChange={(e) => setValue(e.target.value)} aria-label="New delivery date" className="h-9 rounded-md border border-line px-2 text-sm" />
      <Button size="sm" loading={edit.isPending} onClick={() => edit.mutate({ expectedDeliveryDate: value }, { onSuccess: () => setEditing(false) })}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </span>
  );
}

export function AdminOrderPage() {
  const { orderNumber = '' } = useParams();
  useDocumentTitle(`Order ${orderNumber}`);
  const isOwner = useIsOwner();
  const { data: o, isPending, isError, error } = useAdminOrder(orderNumber);

  if (isPending) return <Skeleton className="h-96 rounded-card" />;
  if (isError) return <p className="py-16 text-center text-ink-muted">{error.message}</p>;

  const a = o.shippingAddress;
  const open = ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Orders', to: '/admin/orders' }, { label: o.orderNumber }]} />
      <div className="mt-3">
        <AdminPageHeader title={o.orderNumber} subtitle={`Placed ${when.format(new Date(o.createdAt))}`} actions={<OrderStatusBadge status={o.status} />} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel title={open ? 'Next step' : 'Status'}>
            <StatusActions order={o} />
          </Panel>

          <Panel title="Items">
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.variantSku} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-muted">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium">{i.name}</span>
                    <span className="block text-xs text-ink-muted">
                      {i.variantName}, SKU {i.variantSku}
                    </span>
                    {/* phones: quantity under the name, so the name gets the room */}
                    <span className="block text-xs text-ink-muted tabular-nums sm:hidden">
                      {i.quantity} × {formatBDT(i.unitPrice)}
                      {isOwner && i.unitCost !== undefined && `, cost ${formatBDT(i.unitCost)} each`}
                    </span>
                  </span>
                  <span className="hidden text-right tabular-nums sm:block">
                    {i.quantity} × {formatBDT(i.unitPrice)}
                    {isOwner && i.unitCost !== undefined && <span className="block text-xs text-ink-muted">cost {formatBDT(i.unitCost)} each</span>}
                  </span>
                  <span className="shrink-0 text-right font-medium tabular-nums sm:w-20">{formatBDT(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery, {a.zoneLabel}</dt>
                <dd className="tabular-nums">{formatBDT(o.deliveryCharge)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Collect in cash</dt>
                <dd className="tabular-nums">{formatBDT(o.total)}</dd>
              </div>
              {isOwner && o.profit !== undefined && (
                <div className="flex justify-between text-success">
                  <dt>Product profit</dt>
                  <dd className="tabular-nums">{formatBDT(o.profit)}</dd>
                </div>
              )}
            </dl>
          </Panel>

          <Panel title="History">
            <ol className="space-y-3 border-l-2 border-line pl-4 text-sm">
              {[...o.statusHistory].reverse().map((e, i) => (
                <li key={`${e.status}-${e.at}-${i}`}>
                  <span className="font-medium">{STATUS_LABEL[e.status]}</span>
                  <span className="ml-2 text-ink-muted">
                    {when.format(new Date(e.at))}
                    {e.by ? `, by ${e.by}` : ''}
                  </span>
                  {e.note && <p className="text-ink-muted">{e.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* on phones the customer comes first: staff call them before confirming */}
        <div className="order-first space-y-6 xl:order-none">
          <Panel title="Customer">
            <p className="font-medium">{o.contact.name}</p>
            <a href={`tel:${o.contact.phone}`} className="mt-2 flex items-center gap-2 text-sm text-brand hover:underline">
              <Phone className="h-4 w-4" aria-hidden />
              {o.contact.phone}
            </a>
            <a href={`mailto:${o.contact.email}`} className="mt-1.5 flex items-center gap-2 break-all text-sm text-ink-muted hover:text-ink">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {o.contact.email}
            </a>
            <p className="mt-3 text-xs text-ink-muted">{o.account ? `Has an account (${o.account.email})` : 'Guest checkout'}</p>
          </Panel>

          <Panel title="Delivery">
            <address className="text-sm not-italic leading-relaxed">
              {a.line1}
              <br />
              {[a.area, a.city, a.postcode].filter(Boolean).join(', ')}
            </address>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Area</dt>
                <dd>{a.zoneLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">{o.deliveredAt ? 'Delivered' : 'Promised by'}</dt>
                <dd>
                  {o.deliveredAt ? day.format(new Date(o.deliveredAt)) : <DueDate orderNumber={o.orderNumber} iso={o.expectedDeliveryDate} editable={open} />}
                </dd>
              </div>
              {o.courier && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Courier</dt>
                  <dd className="text-right">
                    {o.courier.name}
                    {o.courier.trackingNumber && <span className="block text-xs text-ink-muted">{o.courier.trackingNumber}</span>}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Payment</dt>
                <dd>Cash on Delivery, {o.paymentStatus === 'paid' ? 'paid' : 'not paid yet'}</dd>
              </div>
            </dl>
            {o.customerNote && (
              <p className="mt-4 rounded-md bg-warning/5 px-3 py-2 text-sm">
                <span className="font-medium">Customer note:</span> {o.customerNote}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
