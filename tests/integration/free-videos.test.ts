import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { cleanup, makeStudent, topicBySlug } from "./helpers";

// FREE_DAILY_VIDEOS is read when the module loads, so set it before importing.
let sv: typeof import("@/lib/solution-video");
const users: string[] = [];
const created: string[] = [];

beforeAll(async () => {
  process.env.FREE_DAILY_VIDEOS = "2";
  delete process.env.YOUTUBE_API_KEY; // teacher videos only: no search
  sv = await import("@/lib/solution-video");
});
afterAll(async () => {
  await db.question.deleteMany({ where: { id: { in: created } } });
  await cleanup(users);
});

async function makeQuestion(video: { videoUrl?: string; videoFree?: boolean } = {}) {
  const topic = await topicBySlug("number-and-numeration--indices");
  const q = await db.question.create({
    data: {
      topicId: topic.id, stem: `Free video test ${Math.random()}`, stemHash: `test-${Math.random()}`, options: ["1", "2"], correctIndex: 0,
      explanation: "Because.", status: "PUBLISHED", videoUrl: video.videoUrl ?? null, videoFree: video.videoFree ?? false,
    },
  });
  created.push(q.id);
  return q;
}

const yt = (n: number) => `https://youtu.be/freevideo${String(n).padStart(2, "0")}`;

describe("FREE_DAILY_VIDEOS allowance", () => {
  it("lets a free student watch 2 videos a day, re-watching for free, then locks", async () => {
    const u = await makeStudent("Free Videos");
    users.push(u.id);
    const [q1, q2, q3] = [await makeQuestion({ videoUrl: yt(1) }), await makeQuestion({ videoUrl: yt(2) }), await makeQuestion({ videoUrl: yt(3) })];

    const today = await sv.freeVideosToday(u.id);
    expect(sv.videoAccessFor(q1, false, sv.freeFor(today, q1.id))).toEqual({ kind: "free", remaining: 2 });

    expect(await sv.unlockFreeVideo(u.id, q1.id)).toMatchObject({ kind: "open", youtubeId: "freevideo01" });
    expect(await sv.unlockFreeVideo(u.id, q1.id)).toMatchObject({ kind: "open", youtubeId: "freevideo01" }); // re-watch
    expect((await sv.freeVideosToday(u.id)).remaining).toBe(1);

    // Already unlocked today → opens straight away on the next page load.
    const after = await sv.freeVideosToday(u.id);
    expect(sv.videoAccessFor(q1, false, sv.freeFor(after, q1.id))).toMatchObject({ kind: "open" });
    expect(sv.videoAccessFor(q2, false, sv.freeFor(after, q2.id))).toEqual({ kind: "free", remaining: 1 });

    expect(await sv.unlockFreeVideo(u.id, q2.id)).toMatchObject({ kind: "open", youtubeId: "freevideo02" });
    expect(await sv.unlockFreeVideo(u.id, q3.id)).toEqual({ kind: "locked", usedFree: true });
    const done = await sv.freeVideosToday(u.id);
    expect(done.remaining).toBe(0);
    expect(sv.videoAccessFor(q3, false, sv.freeFor(done, q3.id))).toEqual({ kind: "locked", usedFree: true });
    expect(await db.videoUnlock.count({ where: { userId: u.id } })).toBe(2);
  });

  it("doesn't spend the allowance on free samples or questions with no video", async () => {
    const u = await makeStudent("Free Videos 2");
    users.push(u.id);
    const sample = await makeQuestion({ videoUrl: yt(4), videoFree: true });
    const novideo = await makeQuestion();
    expect(sv.videoAccessFor(sample, false, sv.freeFor(await sv.freeVideosToday(u.id), sample.id))).toMatchObject({ kind: "open" });
    expect(await sv.unlockFreeVideo(u.id, sample.id)).toMatchObject({ kind: "open" });
    expect(await sv.unlockFreeVideo(u.id, novideo.id)).toEqual({ kind: "none" });
    expect((await sv.freeVideosToday(u.id)).remaining).toBe(2);
  });

  it("Premium ignores the allowance", async () => {
    const q = await makeQuestion({ videoUrl: yt(5) });
    expect(sv.videoAccessFor(q, true)).toMatchObject({ kind: "open", youtubeId: "freevideo05" });
  });
});
