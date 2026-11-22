import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { topicBySlug } from "./helpers";

// A fake YouTube Data API: /search returns two videos, /videos says one is a Short.
let server: Server;
const calls: string[] = [];
let mode: "ok" | "quota" | "empty" = "ok";
let resolveAutoVideo: typeof import("@/lib/solution-video").resolveAutoVideo;
const created: string[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url!, "http://x");
    calls.push(url.pathname + (url.pathname === "/search" ? `?q=${url.searchParams.get("q")}&safe=${url.searchParams.get("safeSearch")}` : ""));
    res.setHeader("content-type", "application/json");
    if (mode === "quota") return void res.writeHead(403).end(JSON.stringify({ error: { errors: [{ reason: "quotaExceeded" }] } }));
    if (url.pathname === "/search") {
      const items = mode === "empty" ? [] : [
        { id: { videoId: "shortvid001" }, snippet: { title: "Indices in 30 seconds", channelTitle: "Fast", description: "" } },
        { id: { videoId: "goodvideo01" }, snippet: { title: "WAEC Indices: evaluate negative fractional powers", channelTitle: "Maths Tutor NG", description: "Indices past question" } },
      ];
      return void res.end(JSON.stringify({ items }));
    }
    res.end(JSON.stringify({ items: [
      { id: "shortvid001", contentDetails: { duration: "PT30S" }, status: { embeddable: true, privacyStatus: "public" } },
      { id: "goodvideo01", contentDetails: { duration: "PT6M10S" }, status: { embeddable: true, privacyStatus: "public" } },
    ] }));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  process.env.YOUTUBE_API_KEY = "test-key";
  process.env.YOUTUBE_API_BASE = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  ({ resolveAutoVideo } = await import("@/lib/solution-video"));
});
afterAll(async () => {
  server?.close();
  await db.question.deleteMany({ where: { id: { in: created } } });
});

async function makeQuestion(stem: string) {
  const topic = await topicBySlug("number-and-numeration--indices");
  const q = await db.question.create({
    data: { topicId: topic.id, stem, stemHash: `test-${Math.random()}`, options: ["1/9", "9"], correctIndex: 0, explanation: "Flip, root, square.", status: "PUBLISHED" },
  });
  created.push(q.id);
  return q;
}

describe("automatic YouTube solution video", () => {
  it("searches once with safe search, skips Shorts, and saves the match", async () => {
    mode = "ok";
    calls.length = 0;
    const q = await makeQuestion("Evaluate $27^{-\\frac{2}{3}}$ (auto video test)");
    const [a, b] = await Promise.all([resolveAutoVideo(q.id), resolveAutoVideo(q.id)]); // two students at once
    expect(a).toMatchObject({ kind: "open", youtubeId: "goodvideo01", source: "youtube", channel: "Maths Tutor NG" });
    expect(b).toEqual(a);
    expect(calls.filter((c) => c.startsWith("/search"))).toHaveLength(1);
    expect(calls[0]).toMatch(/q=Number and Numeration Indices Mathematics .*WAEC&safe=strict/);

    calls.length = 0;
    expect(await resolveAutoVideo(q.id)).toMatchObject({ youtubeId: "goodvideo01" }); // from the database now
    expect(calls).toHaveLength(0);
    expect(await db.question.findUnique({ where: { id: q.id } })).toMatchObject({ autoVideoId: "goodvideo01", autoVideoChannel: "Maths Tutor NG" });
  });

  it("remembers 'nothing found', but retries after quota errors", async () => {
    const q = await makeQuestion("A question nobody has filmed (auto video test)");
    mode = "quota";
    expect(await resolveAutoVideo(q.id)).toEqual({ kind: "unavailable" });
    expect((await db.question.findUnique({ where: { id: q.id } }))?.autoVideoAt).toBeNull();

    mode = "empty";
    expect(await resolveAutoVideo(q.id)).toEqual({ kind: "none" });
    expect((await db.question.findUnique({ where: { id: q.id } }))?.autoVideoAt).toBeInstanceOf(Date);
    calls.length = 0;
    expect(await resolveAutoVideo(q.id)).toEqual({ kind: "none" });
    expect(calls).toHaveLength(0);
  });

  it("never searches when a teacher video is set or search is switched off", async () => {
    calls.length = 0;
    const t = await makeQuestion("Teacher video question (auto video test)");
    await db.question.update({ where: { id: t.id }, data: { videoUrl: "https://youtu.be/teacher0001" } });
    expect(await resolveAutoVideo(t.id)).toMatchObject({ source: "teacher", youtubeId: "teacher0001" });
    const off = await makeQuestion("Blocked question (auto video test)");
    await db.question.update({ where: { id: off.id }, data: { autoVideoBlocked: true } });
    expect(await resolveAutoVideo(off.id)).toEqual({ kind: "none" });
    expect(calls).toHaveLength(0);
  });
});
