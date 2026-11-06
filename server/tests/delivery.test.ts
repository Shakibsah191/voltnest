import { describe, expect, it } from 'vitest';
import { deliveryChargeFor, expectedDeliveryDateFor } from '../src/shared/delivery';

describe('delivery charge', () => {
  it('charges ৳50 inside Rajshahi, ৳50 inside Dhaka and ৳120 everywhere else', () => {
    expect(deliveryChargeFor('inside_rajshahi')).toBe(50);
    expect(deliveryChargeFor('inside_dhaka')).toBe(50);
    expect(deliveryChargeFor('outside_rajshahi')).toBe(120);
  });
});

describe('expected delivery date', () => {
  // Bangladesh time = UTC+6. Day of week checked in Bangladesh time.
  const bdDay = (d: Date) => new Date(d.getTime() + 6 * 3600e3).getUTCDay();
  const bdDate = (d: Date) => new Date(d.getTime() + 6 * 3600e3).toISOString().slice(0, 10);

  it('adds 2 days inside Rajshahi, 3 inside Dhaka and 5 elsewhere', () => {
    const monday = new Date('2026-11-02T04:00:00Z'); // Mon 10:00 in Bangladesh
    expect(bdDate(expectedDeliveryDateFor('inside_rajshahi', monday))).toBe('2026-11-04');
    expect(bdDate(expectedDeliveryDateFor('inside_dhaka', monday))).toBe('2026-11-05');
    expect(bdDate(expectedDeliveryDateFor('outside_rajshahi', monday))).toBe('2026-11-07'); // Saturday
  });

  it('moves a Friday to Saturday', () => {
    const wednesday = new Date('2026-11-04T04:00:00Z'); // +2 days = Friday
    const date = expectedDeliveryDateFor('inside_rajshahi', wednesday);
    expect(bdDay(date)).toBe(6);
    expect(bdDate(date)).toBe('2026-11-07');
  });

  it('uses the Bangladesh date, even late at night UTC', () => {
    const lateNightBd = new Date('2026-11-02T19:30:00Z'); // already Tue 01:30 in Bangladesh
    expect(bdDate(expectedDeliveryDateFor('inside_rajshahi', lateNightBd))).toBe('2026-11-05');
  });

  it('is stored as 18:00 Bangladesh time', () => {
    const date = expectedDeliveryDateFor('outside_rajshahi', new Date('2026-11-02T04:00:00Z'));
    expect(date.toISOString().slice(11, 16)).toBe('12:00');
  });
});
