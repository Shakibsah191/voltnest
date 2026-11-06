import type { EmailMessage } from '../email.service';
import type { OrderConfirmation } from '../../orders/order.service';

/** Customer names and addresses go into HTML, so they must be escaped. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const bdt = (n: number) => `৳${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;

const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' }).format(new Date(iso));

export function orderPlacedEmail(order: OrderConfirmation, shopUrl: string): EmailMessage {
  const firstName = order.contact.name.split(/\s+/)[0] ?? order.contact.name;
  const a = order.shippingAddress;
  const addressLines = [a.line1, [a.area, a.city, a.postcode].filter(Boolean).join(', ')];
  const trackUrl = `${shopUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
  const delivery = order.deliveryCharge === 0 ? 'Free' : bdt(order.deliveryCharge);

  const text = [
    `Hi ${firstName},`,
    '',
    `Thanks for your order. We'll call ${order.contact.phone} to confirm it before we send it out.`,
    '',
    `Order number: ${order.orderNumber}`,
    `Arrives by: ${day(order.expectedDeliveryDate)}`,
    `Payment: Cash on Delivery, pay ${bdt(order.total)} when it arrives`,
    '',
    ...order.items.map((i) => `${i.quantity} × ${i.name} (${i.variantName})  ${bdt(i.lineTotal)}`),
    '',
    `Subtotal: ${bdt(order.subtotal)}`,
    `Delivery (${order.deliveryZone.label}): ${delivery}`,
    `Total: ${bdt(order.total)}`,
    '',
    'Delivering to:',
    order.contact.name,
    ...addressLines,
    '',
    `Track your order: ${trackUrl}`,
    '',
    'VoltNest',
  ].join('\n');

  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #E3E7EE;font-size:14px;color:#1B2230">
          ${esc(i.name)}<br><span style="color:#5B6475;font-size:13px">${esc(i.variantName)}, quantity ${i.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E3E7EE;font-size:14px;color:#1B2230;text-align:right;white-space:nowrap">${bdt(i.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><body style="margin:0;background:#F5F7FA;font-family:Segoe UI,Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;padding:28px">
        <tr><td style="font-size:20px;font-weight:700;color:#2440E6;padding-bottom:20px">voltnest</td></tr>
        <tr><td style="font-size:22px;font-weight:700;color:#1B2230">Thanks, ${esc(firstName)}. Your order is placed.</td></tr>
        <tr><td style="font-size:15px;color:#5B6475;padding:8px 0 20px">We'll call ${esc(order.contact.phone)} to confirm it before we send it out.</td></tr>
        <tr><td style="background:#F5F7FA;border-radius:10px;padding:16px">
          <div style="font-size:13px;color:#5B6475">Order number</div>
          <div style="font-size:20px;font-weight:700;color:#1B2230">${esc(order.orderNumber)}</div>
          <div style="font-size:14px;color:#1B2230;padding-top:10px">Arrives by <b>${day(order.expectedDeliveryDate)}</b></div>
          <div style="font-size:14px;color:#1B2230;padding-top:4px">Cash on Delivery: pay <b>${bdt(order.total)}</b> when it arrives</div>
        </td></tr>
        <tr><td style="padding-top:20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
          <tr><td style="padding-top:12px;font-size:14px;color:#5B6475">Subtotal</td><td style="padding-top:12px;font-size:14px;text-align:right">${bdt(order.subtotal)}</td></tr>
          <tr><td style="padding-top:6px;font-size:14px;color:#5B6475">Delivery, ${esc(order.deliveryZone.label)}</td><td style="padding-top:6px;font-size:14px;text-align:right">${delivery}</td></tr>
          <tr><td style="padding-top:10px;font-size:16px;font-weight:700">Total</td><td style="padding-top:10px;font-size:16px;font-weight:700;text-align:right">${bdt(order.total)}</td></tr>
        </table></td></tr>
        <tr><td style="padding-top:22px;font-size:14px;color:#1B2230">
          <div style="color:#5B6475;font-size:13px;padding-bottom:4px">Delivering to</div>
          ${esc(order.contact.name)}<br>${addressLines.filter(Boolean).map(esc).join('<br>')}
        </td></tr>
        <tr><td style="padding-top:24px">
          <a href="${esc(trackUrl)}" style="display:inline-block;background:#2440E6;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:999px">Track your order</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { to: order.contact.email, subject: `Order ${order.orderNumber} is placed`, html, text };
}
