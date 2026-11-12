import type { EmailMessage } from '../email.service';
import type { OrderConfirmation } from '../../orders/order.service';
import { bdt, button, emailShell, esc, longDay } from './helpers';

export type EmailedStatus = 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface StatusEmailInput {
  order: OrderConfirmation;
  status: EmailedStatus;
  note: string;
  courier: { name: string; trackingNumber: string } | null;
  shopUrl: string;
}

/** One email per customer-facing step. Packing and returns don't email the customer. */
export function statusUpdateEmail({ order, status, note, courier, shopUrl }: StatusEmailInput): EmailMessage {
  const firstName = order.contact.name.split(/\s+/)[0] ?? order.contact.name;
  const trackUrl = `${shopUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
  const n = order.orderNumber;

  const copy: Record<EmailedStatus, { subject: string; heading: string; lines: string[]; cta: string }> = {
    confirmed: {
      subject: `Order ${n} is confirmed`,
      heading: `Your order is confirmed, ${firstName}.`,
      lines: [`We're packing it now. It should arrive by ${longDay(order.expectedDeliveryDate)}.`, `Please keep ${bdt(order.total)} ready in cash.`],
      cta: 'Track your order',
    },
    shipped: {
      subject: `Order ${n} is on the way`,
      heading: `Your order is on the way, ${firstName}.`,
      lines: [
        courier ? `It's with ${courier.name}${courier.trackingNumber ? `, tracking number ${courier.trackingNumber}` : ''}.` : 'It has left our warehouse.',
        `It should arrive by ${longDay(order.expectedDeliveryDate)}. Please keep ${bdt(order.total)} ready in cash.`,
      ],
      cta: 'Track your order',
    },
    delivered: {
      subject: `Order ${n} was delivered`,
      heading: `Your order was delivered, ${firstName}.`,
      lines: ['Thanks for shopping with VoltNest. If you have a minute, a short review helps other buyers choose.'],
      cta: 'Write a review',
    },
    cancelled: {
      subject: `Order ${n} was cancelled`,
      heading: `Your order was cancelled, ${firstName}.`,
      lines: ['Nothing was charged, because it was a Cash on Delivery order.', 'If you didn’t expect this, reply to this email and we’ll sort it out.'],
      cta: 'Shop again',
    },
  };

  const c = copy[status];
  const link = status === 'cancelled' ? `${shopUrl}/collections/all` : trackUrl;
  const noteLine = note ? `Note from the shop: ${note}` : '';
  const items = order.items.map((i) => `${i.quantity} × ${i.name} (${i.variantName})`);

  const text = [
    `Hi ${firstName},`,
    '',
    c.heading,
    ...c.lines,
    ...(noteLine ? ['', noteLine] : []),
    '',
    `Order number: ${n}`,
    ...items,
    `Total: ${bdt(order.total)}`,
    '',
    `${c.cta}: ${link}`,
    '',
    'VoltNest',
  ].join('\n');

  const html = emailShell(`
        <tr><td style="font-size:22px;font-weight:700;color:#1B2230">${esc(c.heading)}</td></tr>
        ${c.lines.map((l) => `<tr><td style="font-size:15px;color:#5B6475;padding-top:8px">${esc(l)}</td></tr>`).join('')}
        ${noteLine ? `<tr><td style="font-size:14px;color:#1B2230;padding-top:14px;background:#F5F7FA;border-radius:10px;padding:12px 14px;margin-top:12px">${esc(noteLine)}</td></tr>` : ''}
        <tr><td style="padding-top:20px;font-size:13px;color:#5B6475">Order ${esc(n)}</td></tr>
        ${items.map((l) => `<tr><td style="font-size:14px;color:#1B2230;padding-top:4px">${esc(l)}</td></tr>`).join('')}
        <tr><td style="font-size:14px;font-weight:700;color:#1B2230;padding-top:8px">Total ${bdt(order.total)}</td></tr>
        <tr><td style="padding-top:24px">${button(link, c.cta)}</td></tr>`);

  return { to: order.contact.email, subject: c.subject, html, text };
}
