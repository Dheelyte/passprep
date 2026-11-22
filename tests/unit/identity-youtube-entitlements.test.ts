import { describe, expect, it } from "vitest";
import { normalizePhone, parseIdentifier } from "@/lib/identity";
import { youtubeId } from "@/lib/youtube";
import { afterEach, vi } from "vitest";
import { canAnswer, daysLeft, isPremium, premiumForEveryone, FREE_DAILY_LIMIT } from "@/lib/entitlements";

describe("phone/email identifiers", () => {
  it.each([
    ["08012345678", "+2348012345678"],
    ["+234 801 234 5678", "+2348012345678"],
    ["2349012345678", "+2349012345678"],
    ["0701-234-5678", "+2347012345678"],
  ])("%s → %s", (input, out) => expect(normalizePhone(input)).toBe(out));
  it("rejects bad numbers", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("05012345678")).toBeNull();
  });
  it("detects email vs phone", () => {
    expect(parseIdentifier(" Tobi@Example.com ")).toEqual({ email: "tobi@example.com" });
    expect(parseIdentifier("08031234567")).toEqual({ phone: "+2348031234567" });
    expect(parseIdentifier("tobi@")).toBeNull();
  });
});

describe("youtube ids", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
  ])("%s", (u) => expect(youtubeId(u)).toBe("dQw4w9WgXcQ"));
  it("rejects other hosts", () => expect(youtubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull());
});

describe("entitlements", () => {
  const now = new Date("2026-11-21T10:00:00Z");
  it("premium until period end, including cancelled-but-paid", () => {
    expect(isPremium({ status: "NON_RENEWING", currentPeriodEnd: new Date("2026-12-01") }, now)).toBe(true);
    expect(isPremium({ status: "ACTIVE", currentPeriodEnd: new Date("2026-11-01") }, now)).toBe(false);
    expect(isPremium({ status: "EXPIRED", currentPeriodEnd: new Date("2027-01-01") }, now)).toBe(false);
    expect(isPremium(null, now)).toBe(false);
  });
  it("free daily limit", () => {
    expect(canAnswer({ premium: false, answeredToday: FREE_DAILY_LIMIT - 1 })).toBe(true);
    expect(canAnswer({ premium: false, answeredToday: FREE_DAILY_LIMIT })).toBe(false);
    expect(canAnswer({ premium: true, answeredToday: 999 })).toBe(true);
  });
});

describe("PREMIUM_FOR_EVERYONE testing switch", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("gives everyone Premium when on", () => {
    vi.stubEnv("PREMIUM_FOR_EVERYONE", "true");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isPremium(null)).toBe(true);
    expect(isPremium({ status: "EXPIRED", currentPeriodEnd: new Date("2020-01-01") })).toBe(true);
    expect(daysLeft(null)).toBeNull(); // no renewal banner
  });
  it("is off unless set to a yes value", () => {
    for (const v of ["", "0", "false", "no"]) {
      vi.stubEnv("PREMIUM_FOR_EVERYONE", v);
      expect(isPremium(null)).toBe(false);
    }
  });
  it("is ignored on Vercel production", () => {
    vi.stubEnv("PREMIUM_FOR_EVERYONE", "true");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(premiumForEveryone()).toBe(false);
    expect(isPremium(null)).toBe(false);
  });
});
