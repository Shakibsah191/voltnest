import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_USER: z.string().trim().optional(),
  MONGODB_PASSWORD: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().default('admin@voltnest.test'),
  ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const clientOrigins = env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean);