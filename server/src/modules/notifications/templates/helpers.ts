/** Customer names and addresses go into HTML, so they must be escaped. */
export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const bdt = (n: number) => `৳${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;

export const longDay = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' }).format(new Date(iso));

/** The white card every VoltNest email sits in. `body` is already-escaped HTML. */
export function emailShell(body: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#F5F7FA;font-family:Segoe UI,Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;padding:28px">
        <tr><td style="font-size:20px;font-weight:700;color:#2440E6;padding-bottom:20px">voltnest</td></tr>
        ${body}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#2440E6;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:999px">${esc(label)}</a>`;
