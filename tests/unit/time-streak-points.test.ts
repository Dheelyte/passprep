import { describe, expect, it } from "vitest";
import { lagosDate, lagosWeekStart, lagosWeekEndsAt, isoDate } from "@/lib/time";
import { applyActivity, displayStreak } from "@/lib/streaks";
import { pointsForAnswer } from "@/lib/points";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("Lagos time", () => {
  it("rolls the calendar day at Lagos midnight (23:00 UTC)", () => {
    expect(isoDate(lagosDate(new Date("2026-11-20T22:59:59Z")))).toBe("2026-11-20");
    expect(isoDate(lagosDate(new Date("2026-11-20T23:00:00Z")))).toBe("2026-11-21");
  });
  it("weeks start on Monday, including late Sunday night UTC that is Monday in Lagos", () => {
    expect(isoDate(lagosWeekStart(new Date("2026-11-22T12:00:00Z")))).toBe("2026-11-16"); // Sunday
    expect(isoDate(lagosWeekStart(new Date("2026-11-22T23:30:00Z")))).toBe("2026-11-23"); // Mon 00:30 Lagos
    expect(lagosWeekEndsAt(new Date("2026-11-18T10:00:00Z")).toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });
});

describe("streaks", () => {
  const base = { currentStreak: 4, longestStreak: 9, lastActiveDate: d("2026-11-20") };
  it("same day does nothing", () => {
    const r = applyActivity(base, d("2026-11-20"));
    expect(r.firstToday).toBe(false);
    expect(r.currentStreak).toBe(4);
  });
  it("next day extends", () => {
    const r = applyActivity(base, d("2026-11-21"));
    expect(r).toMatchObject({ currentStreak: 5, longestStreak: 9, firstToday: true, milestone: null });
  });
  it("missed day resets to 1", () => {
    expect(applyActivity(base, d("2026-11-22")).currentStreak).toBe(1);
  });
  it("first ever activity starts at 1 and tracks longest", () => {
    const r = applyActivity({ currentStreak: 0, longestStreak: 0, lastActiveDate: null }, d("2026-11-21"));
    expect(r).toMatchObject({ currentStreak: 1, longestStreak: 1 });
  });
  it("reports milestones", () => {
    expect(applyActivity({ ...base, currentStreak: 6 }, d("2026-11-21")).milestone).toBe(7);
  });
  it("display streak is 0 once a day is missed, but kept until end of today", () => {
    expect(displayStreak(base, d("2026-11-21"))).toBe(4);
    expect(displayStreak(base, d("2026-11-22"))).toBe(0);
  });
});

describe("points", () => {
  it("awards correct/wrong and no farming of solved questions", () => {
    expect(pointsForAnswer({ isCorrect: true, alreadySolved: false, milestone: null })).toBe(10);
    expect(pointsForAnswer({ isCorrect: false, alreadySolved: false, milestone: null })).toBe(2);
    expect(pointsForAnswer({ isCorrect: true, alreadySolved: true, milestone: null })).toBe(0);
    expect(pointsForAnswer({ isCorrect: true, alreadySolved: true, milestone: 7 })).toBe(50);
  });
});
