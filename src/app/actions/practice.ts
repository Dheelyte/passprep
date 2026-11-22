"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";
import { startPracticeSession, submitAnswer, type AnswerResult } from "@/lib/practice";
import { track } from "@/lib/events";
import { rateLimit } from "@/lib/rate-limit";
import { isPremium } from "@/lib/entitlements";
import { resolveAutoVideo, type VideoAccess } from "@/lib/solution-video";

async function uid() {
  const s = await readSession();
  if (!s) redirect("/login");
  return s.uid;
}

export async function startPractice(form: FormData) {
  const userId = await uid();
  const topicId = String(form.get("topicId") ?? "");
  const session = await startPracticeSession(userId, topicId);
  if (!session) redirect(`/subjects?empty=${encodeURIComponent(topicId)}`);
  track("practice_started", userId, { topicId, size: session.questionIds.length });
  redirect(`/practice/${session.id}`);
}

const answerInput = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(4),
  timeMs: z.number().int().nonnegative().optional(),
});

export async function answerQuestion(input: z.infer<typeof answerInput>): Promise<AnswerResult> {
  const userId = await uid();
  const parsed = answerInput.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Invalid answer." };
  if (!rateLimit(`answer:${userId}`, 60, 60_000)) return { status: "error", message: "Slow down a little and try again." };
  const res = await submitAnswer({ userId, ...parsed.data });
  if (res.status === "ok" && !res.replay) {
    track("question_answered", userId, { questionId: parsed.data.questionId, correct: res.isCorrect, timeMs: parsed.data.timeMs ?? null });
  }
  if (res.status === "ok" && res.video.kind === "locked") track("video_locked", userId, { questionId: parsed.data.questionId });
  if (res.status === "limit") track("paywall_shown", userId, { reason: "daily_limit" });
  return res;
}

/** Tracks video opens; `afterWrong` powers the "are videos useful?" metric. */
export async function videoOpened(questionId: string, afterWrong: boolean, source: "teacher" | "youtube" = "teacher") {
  const userId = await uid();
  if (typeof questionId !== "string" || !/^[a-z0-9]{20,40}$/.test(questionId)) return;
  if (!rateLimit(`video:${userId}`, 60, 60_000)) return;
  track("video_opened", userId, { questionId, afterWrong: afterWrong === true, source: source === "youtube" ? "youtube" : "teacher" });
}

/**
 * Finds the YouTube solution video for a question the student has just answered.
 * Only for questions answered in their own set, and only with Premium, so the search quota can't be farmed.
 */
export async function findSolutionVideo(sessionId: string, questionId: string): Promise<VideoAccess | { kind: "unavailable" }> {
  const userId = await uid();
  if (typeof sessionId !== "string" || typeof questionId !== "string") return { kind: "none" };
  if (!rateLimit(`video-find:${userId}`, 20, 60_000)) return { kind: "unavailable" };
  const [attempt, user] = await Promise.all([
    db.attempt.findUnique({ where: { sessionId_questionId: { sessionId, questionId } }, select: { userId: true } }),
    db.user.findUnique({ where: { id: userId }, select: { subscription: true } }),
  ]);
  if (!attempt || attempt.userId !== userId) return { kind: "none" };
  if (!isPremium(user?.subscription ?? null)) return { kind: "locked" };
  return resolveAutoVideo(questionId);
}

export async function flagQuestion(questionId: string, reason: string): Promise<{ ok: boolean; message: string }> {
  const userId = await uid();
  const text = reason.trim().slice(0, 500);
  if (text.length < 3) return { ok: false, message: "Tell us briefly what looks wrong." };
  if (!rateLimit(`flag:${userId}`, 10, 60 * 60_000)) return { ok: false, message: "You've sent a lot of reports. Try again later." };
  const q = await db.question.findUnique({ where: { id: questionId }, select: { id: true } });
  if (!q) return { ok: false, message: "Question not found." };
  await db.flag.create({ data: { userId, questionId, reason: text } });
  track("flag", userId, { questionId });
  return { ok: true, message: "Thanks! A teacher will check this question." };
}
