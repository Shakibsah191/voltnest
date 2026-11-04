/** Same rules as the server (server/src/shared/validation.ts), so most mistakes are caught before sending. */

/** "+880 1712-345678" → "01712345678" */
export function normalizeBdPhone(value: string) {
  return value.trim().replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, '');
}

export function isValidBdPhone(value: string) {
  return /^01[3-9]\d{8}$/.test(normalizeBdPhone(value));
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
