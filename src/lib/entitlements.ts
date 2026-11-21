import type { Subscription } from "@prisma/client";

export const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 20);

type SubLike = Pick<Subscription, "status" | "currentPeriodEnd"> | null | undefined;

/** Premium = a subscription whose paid period hasn't ended (cancelled subs stay valid until then). */
export function isPremium(sub: SubLike, now: Date = new Date()): boolean {
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
  if (!sub || !isPremium(sub, now)) return null;
  return Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86_400_000);
}
