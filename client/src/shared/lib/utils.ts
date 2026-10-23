/** Join class names, skipping falsy values: cn('a', cond && 'b') */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const bdt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** 12990 → "৳12,990" (lakh grouping for big numbers: ৳1,29,900) */
export function formatBDT(amount: number) {
  return `৳${bdt.format(Math.round(amount))}`;
}

/** Percent off, rounded down so we never overstate a discount. */
export function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}
