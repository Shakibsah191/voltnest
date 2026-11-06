import { emailConfig } from '../../config/email';
import { env } from '../../config/env';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Prints an email in the terminal, for when no Resend key is set. */
function printToTerminal(msg: EmailMessage) {
  const line = '─'.repeat(64);
  console.log(`\n📧 Email (not sent: no RESEND_API_KEY in .env)\n${line}\nTo:      ${msg.to}\nSubject: ${msg.subject}\n${line}\n${msg.text}\n${line}\n`);
}

export const emailService = {
  /**
   * Sends one email. Never throws: a failed email must not break the order
   * that triggered it. Returns true when Resend accepted it.
   */
  async send(msg: EmailMessage): Promise<boolean> {
    if (env.NODE_ENV === 'test') return true; // tests never send real email
    if (!emailConfig.apiKey) {
      printToTerminal(msg);
      return false;
    }

    try {
      const res = await fetch(emailConfig.apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${emailConfig.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailConfig.from,
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          ...(emailConfig.replyTo ? { reply_to: emailConfig.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`📧 Resend refused the email to ${msg.to} (${res.status}): ${body.slice(0, 300)}`);
        if (res.status === 403 && /own email|verify a domain/i.test(body)) {
          console.error('   → Without a verified domain, Resend only delivers to the email you signed up with. Use that email for test orders.');
        }
        return false;
      }
      console.log(`📧 Email sent to ${msg.to}: ${msg.subject}`);
      return true;
    } catch (err) {
      console.error(`📧 Could not reach Resend for ${msg.to}:`, (err as Error).message);
      return false;
    }
  },
};
