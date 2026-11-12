/** Bangladesh is UTC+6 all year. Every "today" in the admin panel means today in Bangladesh. */
const OFFSET = 6 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** 00:00 Bangladesh time on the day `at` falls on, as a real UTC Date. */
export function startOfDhakaDay(at: Date = new Date()): Date {
  const local = new Date(at.getTime() + OFFSET);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET);
}

export function addDays(at: Date, days: number): Date {
  return new Date(at.getTime() + days * DAY);
}

/** "2026-11-08" (a Bangladesh calendar day) → that day's start, or 18:00 for delivery promises. */
export function dhakaDate(ymd: string, hour = 0): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, hour) - OFFSET);
}
