import type { Subscription } from "@prisma/client";

export const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 20);

/** Videos a free-plan student can watch per Lagos day, on top of teacher-marked free samples. 0 = samples only. */
export const FREE_DAILY_VIDEOS = Math.max(0, Math.floor(Number(process.env.FREE_DAILY_VIDEOS ?? 0)) || 0);

type SubLike = Pick<Subscription, "status" | "currentPeriodEnd"> | null | undefined;

/**
 * Testing switch: PREMIUM_FOR_EVERYONE=true gives every account Premium (no daily limit, every video).
 * Ignored on Vercel's production deployment, so a forgotten setting can't give Premium away.
 */
export function premiumForEveryone(): boolean {
  const on = /^(1|true|yes|on)$/i.test(process.env.PREMIUM_FOR_EVERYONE?.trim() ?? "");
  return on && process.env.VERCEL_ENV !== "production";
}

/** Premium = a subscription whose paid period hasn't ended (cancelled subs stay valid until then). */
export function isPremium(sub: SubLike, now: Date = new Date()): boolean {
  if (premiumForEveryone()) return true;
  if (!sub) return false;
  if (sub.status === "EXPIRED") return false;
  return sub.currentPeriodEnd.getTime() > now.getTime();
}

export function canAnswer(opts: { premium: boolean; answeredToday: number }): boolean {
  return opts.premium || opts.answeredToday < FREE_DAILY_LIMIT;
}

export function canWatchVideo(opts: { premium: boolean; videoFree: boolean }): boolean {
  return opts.premium || opts.videoFree;
}

/** Days until access ends, for the renewal reminder banner (fixed-period plans). */
export function daysLeft(sub: SubLike, now: Date = new Date()): number | null {
  if (!sub || premiumForEveryone() || !isPremium(sub, now)) return null;
  return Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86_400_000);
}
