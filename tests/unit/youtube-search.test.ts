import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuery, durationSeconds, keywords, pickBest, plainText, type Candidate } from "@/lib/youtube-search";
import { videoAccessFor } from "@/lib/solution-video";

describe("search terms from a question", () => {
  it("turns markdown + LaTeX into plain words", () => {
    expect(plainText("Evaluate $27^{-\\frac{2}{3}}$.")).toBe("Evaluate 27^ - over 2 3 .");
    expect(plainText("Convert $345_4$ to **base ten**")).toContain("345 base 4");
  });
  it("keeps the distinctive words and drops filler", () => {
    expect(keywords("Find the value of x in the equation 2x + 3 = 11")).toEqual(["equation", "2x", "3", "11"]);
  });
  it("leads with topic and subject and ends with the exam", () => {
    const { query } = buildQuery({ stem: "Evaluate $\\log_{2} 8$", topic: "Logarithms", parentTopic: "Indices and Logarithms", subject: "Mathematics", exams: ["WAEC", "JAMB"] });
    expect(query).toMatch(/^Indices and Logarithms Logarithms Mathematics .*log.* WAEC$/);
  });
});

describe("choosing a video", () => {
  const c = (o: Partial<Candidate>): Candidate => ({ id: "aaaaaaaaaaa", title: "", channel: "Ch", description: "", seconds: 300, embeddable: true, rank: 0, ...o });
  it("parses YouTube durations", () => {
    expect(durationSeconds("PT4M13S")).toBe(253);
    expect(durationSeconds("PT1H2M")).toBe(3720);
    expect(durationSeconds("P0D")).toBe(0);
  });
  it("skips Shorts, long lessons and non-embeddable videos, then prefers keyword matches", () => {
    const best = pickBest(
      [
        c({ id: "short000000", title: "logarithms trick", seconds: 40, rank: 0 }),
        c({ id: "longlesson0", title: "logarithms full course", seconds: 3 * 3600, rank: 1 }),
        c({ id: "private0000", title: "logarithms waec", embeddable: false, rank: 2 }),
        c({ id: "generic0000", title: "maths revision", rank: 3 }),
        c({ id: "match000000", title: "WAEC logarithms past question solved", rank: 4 }),
      ],
      ["logarithms", "waec"],
    );
    expect(best?.id).toBe("match000000");
    expect(pickBest([c({ seconds: 20 })], ["x"])).toBeNull();
  });
});

describe("who gets which video", () => {
  const base = { videoUrl: null, videoFree: false, autoVideoId: null, autoVideoTitle: null, autoVideoChannel: null, autoVideoAt: null, autoVideoBlocked: false };
  afterEach(() => vi.unstubAllEnvs());

  it("teacher videos win and keep the free-sample rule", () => {
    const q = { ...base, videoUrl: "https://youtu.be/abcdefghijk", autoVideoId: "zzzzzzzzzzz" };
    expect(videoAccessFor(q, true)).toMatchObject({ kind: "open", youtubeId: "abcdefghijk", source: "teacher" });
    expect(videoAccessFor(q, false)).toEqual({ kind: "locked" });
    expect(videoAccessFor({ ...q, videoFree: true }, false)).toMatchObject({ kind: "open" });
  });
  it("YouTube videos are Premium-only, searched lazily, and can be switched off", () => {
    vi.stubEnv("YOUTUBE_API_KEY", "k");
    expect(videoAccessFor(base, true)).toEqual({ kind: "find" });
    expect(videoAccessFor({ ...base, videoFree: true }, false)).toEqual({ kind: "locked" });
    expect(videoAccessFor({ ...base, autoVideoId: "zzzzzzzzzzz", autoVideoTitle: "T" }, true)).toMatchObject({ kind: "open", source: "youtube", title: "T" });
    expect(videoAccessFor({ ...base, autoVideoAt: new Date() }, true)).toEqual({ kind: "none" }); // searched, nothing found
    expect(videoAccessFor({ ...base, autoVideoBlocked: true, autoVideoId: "zzzzzzzzzzz" }, true)).toEqual({ kind: "none" });
    vi.stubEnv("YOUTUBE_API_KEY", "");
    expect(videoAccessFor(base, true)).toEqual({ kind: "none" });
  });
});
