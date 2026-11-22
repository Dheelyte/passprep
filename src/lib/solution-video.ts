import "server-only";
import { db } from "./db";
import { canWatchVideo } from "./entitlements";
import { youtubeId } from "./youtube";
import { buildQuery, searchSolutionVideo, youtubeSearchEnabled, YoutubeQuotaError, type FoundVideo } from "./youtube-search";

export type VideoAccess =
  | { kind: "none" }
  | { kind: "locked" }
  | { kind: "open"; youtubeId: string; source: "teacher" | "youtube"; title?: string; channel?: string }
  | { kind: "find" }; // allowed, but not searched yet: the sheet asks for it when opened

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
export function videoAccessFor(q: VideoFields, premium: boolean): VideoAccess {
  const teacher = q.videoUrl ? youtubeId(q.videoUrl) : null;
  if (teacher) return canWatchVideo({ premium, videoFree: q.videoFree }) ? { kind: "open", youtubeId: teacher, source: "teacher" } : { kind: "locked" };

  if (q.autoVideoBlocked) return { kind: "none" };
  if (q.autoVideoId) return premium ? autoOpen(q.autoVideoId, q.autoVideoTitle, q.autoVideoChannel) : { kind: "locked" };
  if (q.autoVideoAt || !youtubeSearchEnabled()) return { kind: "none" }; // searched before and found nothing, or search is off
  return premium ? { kind: "find" } : { kind: "locked" };
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
