// Africa/Lagos is UTC+1 all year (no DST), so day/week maths is a fixed offset.
// Calendar dates are represented as JS Dates at 00:00 UTC of that calendar day,
// which is exactly how Prisma reads/writes Postgres DATE columns.

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The Lagos calendar date for an instant, as a UTC-midnight Date. */
export function lagosDate(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + LAGOS_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Whole days between two calendar dates (b - a). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Monday of the Lagos week containing `at`. Leaderboard weeks run Mon–Sun. */
export function lagosWeekStart(at: Date = new Date()): Date {
  const d = lagosDate(at);
  const dow = d.getUTCDay(); // 0 = Sunday
  const sinceMonday = (dow + 6) % 7;
  return addDays(d, -sinceMonday);
}

/** Instant the current Lagos week ends (next Monday 00:00 Lagos). */
export function lagosWeekEndsAt(at: Date = new Date()): Date {
  return new Date(addDays(lagosWeekStart(at), 7).getTime() - LAGOS_OFFSET_MS);
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - days * DAY_MS);
}

export function hoursUntil(at: Date, from: Date = new Date()): number {
  return Math.max(0, Math.round((at.getTime() - from.getTime()) / 3_600_000));
}
