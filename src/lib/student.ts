import "server-only";
import { db } from "./db";
import { lagosDate } from "./time";
import { displayStreak } from "./streaks";
import { FREE_DAILY_LIMIT, daysLeft, isPremium } from "./entitlements";
import type { CurrentUser } from "./auth";

/** Everything the dashboard header widgets need about the student's day. */
export async function studentToday(user: CurrentUser, now = new Date()) {
  const today = lagosDate(now);
  const answeredToday = await db.attempt.count({ where: { userId: user.id, lagosDate: today } });
  const premium = isPremium(user.subscription, now);
  return {
    today,
    premium,
    answeredToday,
    remaining: premium ? null : Math.max(0, FREE_DAILY_LIMIT - answeredToday),
    limit: FREE_DAILY_LIMIT,
    streak: displayStreak(user, today),
    practisedToday: user.lastActiveDate?.getTime() === today.getTime(),
    daysLeft: daysLeft(user.subscription, now),
    renewsAutomatically: user.subscription?.mode === "AUTO_RENEW" && user.subscription.status === "ACTIVE",
  };
}

/** Subjects the student picked, with published question counts. */
export async function mySubjects(userId: string) {
  const rows = await db.userSubject.findMany({
    where: { userId },
    include: { subject: true },
    orderBy: { subject: { order: "asc" } },
  });
  const counts = await db.question.groupBy({
    by: ["topicId"],
    where: { status: "PUBLISHED", topic: { subjectId: { in: rows.map((r) => r.subjectId) } } },
    _count: true,
  });
  const topicSubject = new Map(
    (await db.topic.findMany({ where: { id: { in: counts.map((c) => c.topicId) } }, select: { id: true, subjectId: true } })).map((t) => [t.id, t.subjectId]),
  );
  const perSubject = new Map<string, number>();
  for (const c of counts) {
    const s = topicSubject.get(c.topicId)!;
    perSubject.set(s, (perSubject.get(s) ?? 0) + c._count);
  }
  return rows.map((r) => ({ ...r.subject, questionCount: perSubject.get(r.subjectId) ?? 0 }));
}
