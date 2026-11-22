import "server-only";
import { db } from "./db";
import { FREE_DAILY_VIDEOS, canWatchVideo } from "./entitlements";
import { lagosDate } from "./time";
import { youtubeId } from "./youtube";
import { buildQuery, searchSolutionVideo, youtubeSearchEnabled, YoutubeQuotaError, type FoundVideo } from "./youtube-search";

export type VideoAccess =
  | { kind: "none" }
  | { kind: "locked"; usedFree?: boolean } // usedFree: today's free videos are used up
  | { kind: "open"; youtubeId: string; source: "teacher" | "youtube"; title?: string; channel?: string }
  | { kind: "find" } // allowed, but not searched yet: the sheet asks for it when opened
  | { kind: "free"; remaining: number }; // free plan: opening it uses one of today's FREE_DAILY_VIDEOS

/** A free-plan student's video allowance for today, for one question. */
export type FreeVideos = { remaining: number; unlocked: boolean };
const NO_FREE: FreeVideos = { remaining: 0, unlocked: false };

type VideoFields = {
  videoUrl: string | null;
  videoFree: boolean;
  autoVideoId: string | null;
  autoVideoTitle: string | null;
  autoVideoChannel: string | null;
  autoVideoAt: Date | null;
  autoVideoBlocked: boolean;
};

/**
 * What the "Watch the solution" button does for this student.
 * A teacher's video always wins. Otherwise a YouTube video found from the question's keywords
 * (Premium only: the free-sample flag is for videos a teacher has chosen).
 */
export function videoAccessFor(q: VideoFields, premium: boolean, free: FreeVideos = NO_FREE): VideoAccess {
  // Free plan without a sample: re-watch what was unlocked today, spend an allowance, or upsell.
  const gated = (open: VideoAccess): VideoAccess =>
    free.unlocked ? open : free.remaining > 0 ? { kind: "free", remaining: free.remaining } : FREE_DAILY_VIDEOS > 0 ? { kind: "locked", usedFree: true } : { kind: "locked" };

  const teacher = q.videoUrl ? youtubeId(q.videoUrl) : null;
  if (teacher) {
    const open: VideoAccess = { kind: "open", youtubeId: teacher, source: "teacher" };
    return canWatchVideo({ premium, videoFree: q.videoFree }) ? open : gated(open);
  }

  if (q.autoVideoBlocked) return { kind: "none" };
  if (q.autoVideoId) {
    const open = autoOpen(q.autoVideoId, q.autoVideoTitle, q.autoVideoChannel);
    return premium ? open : gated(open);
  }
  if (q.autoVideoAt || !youtubeSearchEnabled()) return { kind: "none" }; // searched before and found nothing, or search is off
  // Not searched yet. A free unlock searches first and only counts if a video turns up.
  return premium ? { kind: "find" } : gated({ kind: "find" });
}

/** Today's free-video usage for a student: how many are left and which questions are already unlocked. */
export async function freeVideosToday(userId: string, today: Date = lagosDate()) {
  if (FREE_DAILY_VIDEOS === 0) return { remaining: 0, unlocked: new Set<string>() };
  const rows = await db.videoUnlock.findMany({ where: { userId, lagosDate: today }, select: { questionId: true } });
  return { remaining: Math.max(0, FREE_DAILY_VIDEOS - rows.length), unlocked: new Set(rows.map((r) => r.questionId)) };
}

export const freeFor = (t: { remaining: number; unlocked: Set<string> }, questionId: string): FreeVideos => ({
  remaining: t.remaining,
  unlocked: t.unlocked.has(questionId),
});

/**
 * Spends one of today's free videos on a question and returns the video.
 * Nothing is spent when no video exists (or YouTube can't be reached). Re-opening the same question today is free.
 */
export async function unlockFreeVideo(userId: string, questionId: string): Promise<VideoAccess | { kind: "unavailable" }> {
  const today = lagosDate();
  const q = await db.question.findUnique({ where: { id: questionId } });
  if (!q || q.status !== "PUBLISHED") return { kind: "none" };
  const access = videoAccessFor(q, false, freeFor(await freeVideosToday(userId, today), questionId));
  if (access.kind !== "free") return access;

  // What the video is (searching YouTube if needed), as Premium would see it.
  const video = videoAccessFor(q, true);
  const found = video.kind === "find" ? await resolveAutoVideo(questionId) : video;
  if (found.kind !== "open") return found;

  try {
    await db.videoUnlock.create({ data: { userId, questionId, lagosDate: today } });
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e; // P2002: unlocked already (double tap)
    return found;
  }
  // Two unlocks racing past the check above: keep only the allowance.
  const used = await db.videoUnlock.count({ where: { userId, lagosDate: today } });
  if (used > FREE_DAILY_VIDEOS) {
    await db.videoUnlock.deleteMany({ where: { userId, questionId, lagosDate: today } });
    return { kind: "locked", usedFree: true };
  }
  return found;
}

const autoOpen = (id: string, title: string | null, channel: string | null): VideoAccess => ({
  kind: "open", youtubeId: id, source: "youtube", title: title ?? undefined, channel: channel ?? undefined,
});

// One search per question at a time on this server instance.
const inflight = new Map<string, Promise<FoundVideo | null>>();

/** Search YouTube for the question (once), save the result, and return it. */
export async function resolveAutoVideo(questionId: string): Promise<VideoAccess | { kind: "unavailable" }> {
  const q = await db.question.findUnique({
    where: { id: questionId },
    include: { topic: { select: { name: true, exams: true, subject: { select: { name: true } }, parent: { select: { name: true } } } } },
  });
  if (!q || q.status !== "PUBLISHED") return { kind: "none" };
  const access = videoAccessFor(q, true);
  if (access.kind !== "find") return access;

  let job = inflight.get(questionId);
  if (!job) {
    const { query, words } = buildQuery({ stem: q.stem, topic: q.topic.name, parentTopic: q.topic.parent?.name, subject: q.topic.subject.name, exams: q.topic.exams });
    job = searchSolutionVideo(query, words).finally(() => inflight.delete(questionId));
    inflight.set(questionId, job);
  }
  let found: FoundVideo | null;
  try {
    found = await job;
  } catch (e) {
    // Quota or network trouble: don't save "nothing found", so it's tried again later.
    console.error("youtube search failed", questionId, e instanceof YoutubeQuotaError ? "(quota)" : e);
    return { kind: "unavailable" };
  }
  await db.question.update({
    where: { id: questionId },
    data: { autoVideoId: found?.id ?? null, autoVideoTitle: found?.title.slice(0, 200) ?? null, autoVideoChannel: found?.channel.slice(0, 100) ?? null, autoVideoAt: new Date() },
  });
  return found ? autoOpen(found.id, found.title, found.channel) : { kind: "none" };
}
