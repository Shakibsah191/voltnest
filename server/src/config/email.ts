import 'dotenv/config';
import { z } from 'zod';
import { clientOrigins } from './env';

/**
 * Email settings (Resend). All optional: with no RESEND_API_KEY the server
 * prints each email in the terminal instead of sending it.
 *
 *   RESEND_API_KEY=re_...
 *   EMAIL_FROM=VoltNest <onboarding@resend.dev>
 *
 * Without your own domain verified in Resend, keep onboarding@resend.dev as the sender.
 * Resend then only delivers to the email address you signed up with.
 */
const schema = z.object({
  RESEND_API_KEY: z.string().trim().optional(),
  EMAIL_FROM: z.string().trim().default('VoltNest <onboarding@resend.dev>'),
  EMAIL_REPLY_TO: z.string().trim().email().optional().or(z.literal('')),
  // only changed by tests
  RESEND_API_URL: z.string().url().default('https://api.resend.com/emails'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid email settings in .env:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const emailConfig = {
  apiKey: parsed.data.RESEND_API_KEY || null,
  from: parsed.data.EMAIL_FROM,
  replyTo: parsed.data.EMAIL_REPLY_TO || undefined,
  apiUrl: parsed.data.RESEND_API_URL,
  /** Links inside emails point here. */
  shopUrl: clientOrigins[0] ?? 'http://localhost:5173',
};
