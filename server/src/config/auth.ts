import 'dotenv/config';
import { z } from 'zod';
import { isProd } from './env';

/**
 * Auth settings. Kept apart from env.ts so that file never has to change.
 *
 * Add these two lines to server/.env (make each one a long random string):
 *   JWT_ACCESS_SECRET=...
 *   JWT_REFRESH_SECRET=...
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
 */
const DEV_ACCESS = 'dev-only-access-secret-change-me-0123456789abcdef';
const DEV_REFRESH = 'dev-only-refresh-secret-change-me-0123456789abcdef';

const schema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters').optional(),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters').optional(),
  // "true" only if the client and API are on different sites (no Vercel /api rewrite)
  CROSS_SITE_COOKIES: z.enum(['true', 'false']).default('false'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid auth settings in .env:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

if (!raw.JWT_ACCESS_SECRET || !raw.JWT_REFRESH_SECRET) {
  if (isProd) {
    console.error('❌ JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production.');
    process.exit(1);
  }
  console.warn('⚠️  JWT secrets are missing from .env — using development-only secrets. Add them before deploying.');
}

if (raw.JWT_ACCESS_SECRET && raw.JWT_ACCESS_SECRET === raw.JWT_REFRESH_SECRET) {
  console.error('❌ JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
  process.exit(1);
}

const crossSite = raw.CROSS_SITE_COOKIES === 'true';

export const authConfig = {
  accessSecret: raw.JWT_ACCESS_SECRET ?? DEV_ACCESS,
  refreshSecret: raw.JWT_REFRESH_SECRET ?? DEV_REFRESH,
  accessTtl: '15m',
  refreshTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  guestCartTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  bcryptRounds: 12,
  cookies: {
    refresh: 'vn_rt',
    guestCart: 'vn_cid',
    // Same site (Vite proxy in dev, Vercel rewrite in production) → Lax is enough and safest.
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax',
    secure: crossSite || isProd,
  },
} as const;
