import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { startPracticeSession, submitAnswer } from "@/lib/practice";
import { lagosDate, lagosWeekStart } from "@/lib/time";
import { subjectProgress } from "@/lib/progress";
import { weeklyLeaderboard } from "@/lib/leaderboard";
import { cleanup, makeStudent, topicBySlug } from "./helpers";

const users: string[] = [];
afterAll(() => cleanup(users));

describe("practice flow (free student, limit 3/day)", () => {
  it("builds a set from the topic, scores answers, updates streak/points/leaderboard, enforces the free limit", async () => {
    const u = await makeStudent("Practice Tester");
    users.push(u.id);
    const topic = await topicBySlug("number-and-numeration"); // includes subtopics
    const session = await startPracticeSession(u.id, topic.id);
    expect(session).not.toBeNull();
    expect(session!.questionIds.length).toBe(10);

    const qs = await db.question.findMany({ where: { id: { in: session!.questionIds } } });
    const byId = new Map(qs.map((q) => [q.id, q]));
    const [q1, q2, q3, q4] = session!.questionIds;

    // correct answer: +10, streak starts at 1
    const r1 = await submitAnswer({ userId: u.id, sessionId: session!.id, questionId: q1, selectedIndex: byId.get(q1)!.correctIndex });
    expect(r1).toMatchObject({ status: "ok", isCorrect: true, pointsAwarded: 10, streak: 1, answeredToday: 1, limit: 3 });
    if (r1.status === "ok") expect(r1.explanationHtml.length).toBeGreaterThan(20);

    // replaying the same question in the same set is idempotent (no extra points, no extra count)
    const replay = await submitAnswer({ userId: u.id, sessionId: session!.id, questionId: q1, selectedIndex: 0 });
    expect(replay).toMatchObject({ status: "ok", replay: true, pointsAwarded: 0, isCorrect: true });

    // wrong answer: +2
    const wrongIdx = (byId.get(q2)!.correctIndex + 1) % byId.get(q2)!.options.length;
    const r2 = await submitAnswer({ userId: u.id, sessionId: session!.id, questionId: q2, selectedIndex: wrongIdx });
    expect(r2).toMatchObject({ status: "ok", isCorrect: false, pointsAwarded: 2, correctIndex: byId.get(q2)!.correctIndex });

    await submitAnswer({ userId: u.id, sessionId: session!.id, questionId: q3, selectedIndex: 0 });
    // 4th answer today → limit
    const r4 = await submitAnswer({ userId: u.id, sessionId: session!.id, questionId: q4, selectedIndex: 0 });
    expect(r4).toEqual({ status: "limit", limit: 3 });

    const fresh = await db.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(fresh.currentStreak).toBe(1);
    expect(fresh.lastActiveDate?.toISOString()).toBe(lagosDate().toISOString());
    const weekly = await db.weeklyScore.findUniqueOrThrow({ where: { userId_weekStart: { userId: u.id, weekStart: lagosWeekStart() } } });
    expect(weekly.points).toBe(fresh.totalPoints);
    expect(weekly.answered).toBe(3);

    const board = await weeklyLeaderboard(u.id);
    expect(board.me?.name).toBe("Practice T.");

    const progress = await subjectProgress(u.id, topic.subjectId);
    expect(progress.find((p) => p.topicId === topic.id)?.attempts).toBe(3);
  });

  it("rejects questions outside the set and other students' sets", async () => {
    const a = await makeStudent();
    const b = await makeStudent();
    users.push(a.id, b.id);
    const topic = await topicBySlug("algebra--linear-equations");
    const session = await startPracticeSession(a.id, topic.id);
    const other = await db.question.findFirstOrThrow({ where: { NOT: { id: { in: session!.questionIds } }, status: "PUBLISHED" } });
    expect((await submitAnswer({ userId: a.id, sessionId: session!.id, questionId: other.id, selectedIndex: 0 })).status).toBe("error");
    expect((await submitAnswer({ userId: b.id, sessionId: session!.id, questionId: session!.questionIds[0], selectedIndex: 0 })).status).toBe("error");
  });

  it("locks non-sample videos for free students and opens sample ones", async () => {
    const u = await makeStudent();
    users.push(u.id);
    const locked = await db.question.findFirstOrThrow({ where: { status: "PUBLISHED", videoUrl: { not: null }, videoFree: false } });
    const free = await db.question.findFirstOrThrow({ where: { status: "PUBLISHED", videoUrl: { not: null }, videoFree: true } });
    for (const [q, kind] of [[locked, "locked"], [free, "open"]] as const) {
      const s = await db.practiceSession.create({ data: { userId: u.id, topicId: q.topicId, questionIds: [q.id] } });
      const r = await submitAnswer({ userId: u.id, sessionId: s.id, questionId: q.id, selectedIndex: 0 });
      expect(r.status === "ok" && r.video.kind).toBe(kind);
    }
  });
});
