import { z } from 'zod';
import { bdPhone, email, personName } from '../../shared/validation';

// bcrypt only uses the first 72 bytes of a password, so cap it there
const password = z
  .string({ error: 'Enter a password' })
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters');

export const registerSchema = z.object({
  name: personName,
  email,
  password,
  phone: z.preprocess((v) => (v === '' ? undefined : v), bdPhone.optional()),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Enter your password' }).min(1, 'Enter your password').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;
