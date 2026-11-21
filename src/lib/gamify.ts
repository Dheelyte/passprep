import "server-only";
import { db } from "./db";
import { addDays, lagosDate, lagosWeekStart } from "./time";
import type { BadgeDef } from "@/components/ds/rewards";

// Read-only views over existing tables (attempts, users, weekly_scores). No schema changes.

/** Lagos dates (ISO) on which the student answered at least one question, over the last `days`. */
export async function activeDays(userId: string, days = 35, now = new Date()) {
  const today = lagosDate(now);
  const from = addDays(today, -(days - 1));
  const rows = await db.attempt.groupBy({ by: ["lagosDate"], where: { userId, lagosDate: { gte: from } }, _count: true });
  return { from, today, active: new Map(rows.map((r) => [r.lagosDate.toISOString().slice(0, 10), r._count])) };
}

/** Last week's rank (by points) — powers the rank-change arrow. null if they didn't score last week. */
export async function lastWeekRank(userId: string, now = new Date()) {
  const prev = addDays(lagosWeekStart(now), -7);
  const mine = await db.weeklyScore.findUnique({ where: { userId_weekStart: { userId, weekStart: prev } } });
  if (!mine || mine.points <= 0) return null;
  return (await db.weeklyScore.count({ where: { weekStart: prev, points: { gt: mine.points } } })) + 1;
}

/** Per-user aggregate stats used by badges and the profile. */
export async function userStats(userId: string) {
  const [answered, correct, perfectSets, topicsTried, videos] = await Promise.all([
    db.attempt.count({ where: { userId } }),
    db.attempt.count({ where: { userId, isCorrect: true } }),
    db.practiceSession.count({ where: { userId, finishedAt: { not: null }, answered: { gte: 5 }, correct: { equals: db.practiceSession.fields.answered } } }),
    db.practiceSession.findMany({ where: { userId }, distinct: ["topicId"], select: { topicId: true } }).then((r) => r.length),
    db.event.count({ where: { userId, type: "video_opened" } }),
  ]);
  return { answered, correct, perfectSets, topicsTried, videos };
}

/** Badge catalogue, computed from stats. Earned = true when the condition is met. */
export function badgesFor(s: Awaited<ReturnType<typeof userStats>>, streak: { current: number; longest: number }): BadgeDef[] {
  return [
    { id: "first", name: "First step", hint: "Answer 1 question", earned: s.answered >= 1, shape: "circle", color: "var(--sun)", glyph: "1" },
    { id: "fifty", name: "Half-century", hint: "Answer 50", earned: s.answered >= 50, shape: "shield", color: "var(--maths)", glyph: "50" },
    { id: "ton", name: "Century", hint: "Answer 100", earned: s.answered >= 100, shape: "burst", color: "var(--coral)", glyph: "100" },
    { id: "streak3", name: "On fire", hint: "3-day streak", earned: streak.longest >= 3, shape: "star", color: "var(--physics)", glyph: "3" },
    { id: "streak7", name: "Week warrior", hint: "7-day streak", earned: streak.longest >= 7, shape: "star", color: "var(--grape)", glyph: "7" },
    { id: "streak30", name: "Unstoppable", hint: "30-day streak", earned: streak.longest >= 30, shape: "burst", color: "var(--english)", glyph: "30" },
    { id: "perfect", name: "Clean sheet", hint: "Perfect set (5+)", earned: s.perfectSets >= 1, shape: "shield", color: "var(--chemistry)", glyph: "A1" },
    { id: "explorer", name: "Explorer", hint: "Try 5 topics", earned: s.topicsTried >= 5, shape: "circle", color: "var(--biology)", glyph: "5" },
    { id: "watcher", name: "Replay king", hint: "Watch a solution", earned: s.videos >= 1, shape: "circle", color: "var(--geography)", glyph: "↺" },
  ];
}

/** Everyone's rank last week (userId → rank), for rank-change arrows on the board. */
export async function lastWeekRanks(now = new Date()) {
  const prev = addDays(lagosWeekStart(now), -7);
  const rows = await db.weeklyScore.findMany({ where: { weekStart: prev, points: { gt: 0 } }, orderBy: [{ points: "desc" }, { updatedAt: "asc" }], select: { userId: true } });
  return new Map(rows.map((r, i) => [r.userId, i + 1]));
}
