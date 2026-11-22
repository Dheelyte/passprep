import "server-only";
import { db } from "./db";
import { lagosDate, lagosWeekStart } from "./time";
import { displayStreak } from "./streaks";

export type LeaderRow = { rank: number; userId: string; name: string; points: number; streak: number; classLevel: string | null };

/** Show first name + last initial only, since students are minors. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function weeklyLeaderboard(userId: string, limit = 50, now = new Date()) {
  const weekStart = lagosWeekStart(now);
  const today = lagosDate(now);
  const top = await db.weeklyScore.findMany({
    where: { weekStart, points: { gt: 0 } },
    orderBy: [{ points: "desc" }, { updatedAt: "asc" }],
    take: limit,
    include: { user: { select: { name: true, currentStreak: true, longestStreak: true, lastActiveDate: true, classLevel: true } } },
  });

  const rows: LeaderRow[] = top.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: publicName(r.user.name),
    points: r.points,
    streak: displayStreak(r.user, today),
    classLevel: r.user.classLevel,
  }));

  let me: LeaderRow | null = rows.find((r) => r.userId === userId) ?? null;
  if (!me) {
    const mine = await db.weeklyScore.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: { user: { select: { name: true, currentStreak: true, longestStreak: true, lastActiveDate: true, classLevel: true } } },
    });
    if (mine && mine.points > 0) {
      const ahead = await db.weeklyScore.count({ where: { weekStart, points: { gt: mine.points } } });
      me = {
        rank: ahead + 1,
        userId,
        name: publicName(mine.user.name),
        points: mine.points,
        streak: displayStreak(mine.user, today),
        classLevel: mine.user.classLevel,
      };
    }
  }
  return { weekStart, rows, me };
}
