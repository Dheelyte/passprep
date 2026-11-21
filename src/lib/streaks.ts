import { daysBetween } from "./time";

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
};

export type StreakUpdate = StreakState & {
  /** true when this is the first activity of `today` */
  firstToday: boolean;
  /** streak length reached today, when it just hit a milestone */
  milestone: number | null;
};

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

/** Pure streak transition for an activity on Lagos date `today`. */
export function applyActivity(state: StreakState, today: Date): StreakUpdate {
  const last = state.lastActiveDate;
  if (last && daysBetween(last, today) <= 0) {
    return { ...state, firstToday: false, milestone: null };
  }
  const current = last && daysBetween(last, today) === 1 ? state.currentStreak + 1 : 1;
  return {
    currentStreak: current,
    longestStreak: Math.max(state.longestStreak, current),
    lastActiveDate: today,
    firstToday: true,
    milestone: (STREAK_MILESTONES as readonly number[]).includes(current) ? current : null,
  };
}

/** The streak to *display*: a streak is broken if the student missed yesterday. */
export function displayStreak(state: StreakState, today: Date): number {
  if (!state.lastActiveDate) return 0;
  return daysBetween(state.lastActiveDate, today) <= 1 ? state.currentStreak : 0;
}
