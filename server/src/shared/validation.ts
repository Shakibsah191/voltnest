import { z } from 'zod';

/**
 * Bangladeshi mobile numbers: accepts "01712-345678", "+8801712345678", "8801712 345678"
 * and stores them as 01712345678 (11 digits, operator codes 013–019).
 */
export const bdPhone = z
  .string({ required_error: 'Enter your mobile number' })
  .trim()
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, ''))
  .pipe(z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number, like 01712345678'));

export const email = z
  .string({ required_error: 'Enter your email address' })
  .trim()
  .toLowerCase()
  .max(120)
  .email('Enter a valid email address');

export const personName = z
  .string({ required_error: 'Enter your name' })
  .trim()
  .min(2, 'Enter your full name')
  .max(80, 'Name is too long');
