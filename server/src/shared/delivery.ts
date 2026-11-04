/**
 * Delivery zones, charges and delivery times — the ONE place they are defined.
 * The checkout page reads them from GET /api/v1/checkout/options, and
 * orders.service uses them to price every order. Change a number here and
 * both follow. Adding a zone = add a key to DELIVERY_ZONES and to DELIVERY_OPTIONS.
 */
export const DELIVERY_ZONES = ['inside_rajshahi', 'outside_rajshahi'] as const;
export type DeliveryZone = (typeof DELIVERY_ZONES)[number];

export interface DeliveryOption {
  label: string;
  description: string;
  charge: number; // BDT
  minDays: number;
  maxDays: number;
}

export const DELIVERY_OPTIONS: Record<DeliveryZone, DeliveryOption> = {
  inside_rajshahi: {
    label: 'Inside Rajshahi',
    description: 'Rajshahi city and its thanas',
    charge: 50,
    minDays: 1,
    maxDays: 2,
  },
  outside_rajshahi: {
    label: 'Outside Rajshahi',
    description: 'Anywhere else in Bangladesh',
    charge: 120,
    minDays: 3,
    maxDays: 5,
  },
};

/** Orders with a subtotal at or above this get free delivery in every zone (BDT). */
export const FREE_DELIVERY_THRESHOLD = 3000;

export function deliveryChargeFor(zone: DeliveryZone, subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_OPTIONS[zone].charge;
}

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000; // Bangladesh is UTC+6, no daylight saving
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The latest day the order should arrive: today + maxDays (Bangladesh time).
 * Couriers don't deliver on Friday, so a Friday moves to Saturday.
 * Stored as 18:00 Bangladesh time so the date never flips when shown in another time zone.
 */
export function expectedDeliveryDateFor(zone: DeliveryZone, from: Date = new Date()): Date {
  const local = new Date(from.getTime() + DHAKA_OFFSET_MS + DELIVERY_OPTIONS[zone].maxDays * DAY_MS);
  if (local.getUTCDay() === 5) local.setTime(local.getTime() + DAY_MS); // Friday → Saturday
  local.setUTCHours(18, 0, 0, 0); // 18:00 "local" …
  return new Date(local.getTime() - DHAKA_OFFSET_MS); // … converted back to real UTC (12:00Z)
}

export function publicDeliveryOptions() {
  return DELIVERY_ZONES.map((id) => ({ id, ...DELIVERY_OPTIONS[id] }));
}
