import "server-only";
import { db } from "./db";
import { lagosDate, lagosWeekStart } from "./time";
import { applyActivity } from "./streaks";
import { pointsForAnswer } from "./points";
import { FREE_DAILY_LIMIT, canAnswer, isPremium } from "./entitlements";
import { renderMarkdown } from "./markdown";
import { freeFor, freeVideosToday, videoAccessFor, type VideoAccess } from "./solution-video";

export type { VideoAccess };

export const SET_SIZE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Topic plus its subtopics. */
export async function topicScopeIds(topicId: string): Promise<string[]> {
  const children = await db.topic.findMany({ where: { parentId: topicId }, select: { id: true } });
  return [topicId, ...children.map((c) => c.id)];
}

/**
 * Pick a practice set: unseen questions first, then ones last answered wrong,
 * then already-solved ones (revision), with difficulty spread across the set.
 */
export function pickQuestions(
  questions: { id: string; difficulty: string }[],
  lastResult: Map<string, boolean>,
  size = SET_SIZE,
): string[] {
  const unseen = shuffle(questions.filter((q) => !lastResult.has(q.id)));
  const wrong = shuffle(questions.filter((q) => lastResult.get(q.id) === false));
  const solved = shuffle(questions.filter((q) => lastResult.get(q.id) === true));
  const picked = [...unseen, ...wrong, ...solved].slice(0, size);
  const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as Record<string, number>;
  // gentle ramp: easy → hard within the set
  return picked.sort((a, b) => (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1)).map((q) => q.id);
}

export async function startPracticeSession(userId: string, topicId: string) {
  const scope = await topicScopeIds(topicId);
  const questions = await db.question.findMany({
    where: { topicId: { in: scope }, status: "PUBLISHED" },
    select: { id: true, difficulty: true },
  });
  if (questions.length === 0) return null;

  const attempts = await db.attempt.findMany({
    where: { userId, questionId: { in: questions.map((q) => q.id) } },
    orderBy: { createdAt: "asc" },
    select: { questionId: true, isCorrect: true },
  });
  const last = new Map<string, boolean>();
  for (const a of attempts) last.set(a.questionId, a.isCorrect);

  return db.practiceSession.create({
    data: { userId, topicId, questionIds: pickQuestions(questions, last) },
  });
}

export async function answeredToday(userId: string, today = lagosDate()) {
  return db.attempt.count({ where: { userId, lagosDate: today } });
}

export type AnswerResult =
  | {
      status: "ok";
      isCorrect: boolean;
      correctIndex: number;
      explanationHtml: string;
      video: VideoAccess;
      pointsAwarded: number;
      streak: number;
      milestone: number | null;
      answeredToday: number;
      limit: number | null; // null = unlimited (premium)
      replay: boolean;
    }
  | { status: "limit"; limit: number }
  | { status: "error"; message: string };

export async function submitAnswer(input: {
  userId: string;
  sessionId: string;
  questionId: string;
  selectedIndex: number;
  timeMs?: number;
}): Promise<AnswerResult> {
  const { userId, sessionId, questionId, selectedIndex } = input;
  const now = new Date();
  const today = lagosDate(now);

  const [session, question, user] = await Promise.all([
    db.practiceSession.findUnique({ where: { id: sessionId } }),
    db.question.findUnique({ where: { id: questionId } }),
    db.user.findUnique({ where: { id: userId }, include: { subscription: true } }),
  ]);
  if (!session || session.userId !== userId || !session.questionIds.includes(questionId))
    return { status: "error", message: "This question is not part of your practice set." };
  if (!question || question.status !== "PUBLISHED" || !user)
    return { status: "error", message: "Question not available." };
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length)
    return { status: "error", message: "Invalid option." };

  const premium = isPremium(user.subscription, now);
  const video: VideoAccess = videoAccessFor(question, premium, premium ? undefined : freeFor(await freeVideosToday(userId, today), questionId));
  const explanationHtml = renderMarkdown(question.explanation);

  // Idempotent: answering the same question twice in one set returns the first result.
  const existing = await db.attempt.findUnique({ where: { sessionId_questionId: { sessionId, questionId } } });
  if (existing) {
    return {
      status: "ok",
      isCorrect: existing.isCorrect,
      correctIndex: question.correctIndex,
      explanationHtml,
      video,
      pointsAwarded: 0,
      streak: user.currentStreak,
      milestone: null,
      answeredToday: await answeredToday(userId, today),
      limit: premium ? null : FREE_DAILY_LIMIT,
      replay: true,
    };
  }

  const countToday = await answeredToday(userId, today);
  if (!canAnswer({ premium, answeredToday: countToday })) return { status: "limit", limit: FREE_DAILY_LIMIT };

  const isCorrect = selectedIndex === question.correctIndex;
  const alreadySolved =
    (await db.attempt.count({ where: { userId, questionId, isCorrect: true } })) > 0;
  const streak = applyActivity(user, today);
  const points = pointsForAnswer({ isCorrect, alreadySolved, milestone: streak.milestone });
  const weekStart = lagosWeekStart(now);

  try {
    await db.$transaction([
      db.attempt.create({
        data: {
          userId,
          questionId,
          sessionId,
          selectedIndex,
          isCorrect,
          timeMs: input.timeMs && input.timeMs > 0 ? Math.min(input.timeMs, 3_600_000) : null,
          pointsAwarded: points,
          lagosDate: today,
        },
      }),
      db.user.update({
        where: { id: userId },
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActiveDate: streak.lastActiveDate,
          totalPoints: { increment: points },
        },
      }),
      db.weeklyScore.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: { userId, weekStart, points, answered: 1 },
        update: { points: { increment: points }, answered: { increment: 1 } },
      }),
      db.practiceSession.update({
        where: { id: sessionId },
        data: {
          answered: { increment: 1 },
          correct: { increment: isCorrect ? 1 : 0 },
          finishedAt: session.answered + 1 >= session.questionIds.length ? now : undefined,
        },
      }),
    ]);
  } catch (e: unknown) {
    // Double-submit race on the unique (session, question) index → treat as replay.
    if ((e as { code?: string }).code === "P2002") {
      return submitAnswer(input);
    }
    throw e;
  }

  return {
    status: "ok",
    isCorrect,
    correctIndex: question.correctIndex,
    explanationHtml,
    video,
    pointsAwarded: points,
    streak: streak.currentStreak,
    milestone: streak.milestone,
    answeredToday: countToday + 1,
    limit: premium ? null : FREE_DAILY_LIMIT,
    replay: false,
  };
}
