export const POINTS = {
  correct: 10,
  wrong: 2,
  /** bonus by streak milestone length */
  streakBonus: { 3: 20, 7: 50, 14: 80, 30: 150, 60: 250, 100: 400 } as Record<number, number>,
};

/**
 * Points for one answer. Re-answering a question the student already solved
 * earns nothing, so points can't be farmed by repeating easy questions.
 */
export function pointsForAnswer(opts: {
  isCorrect: boolean;
  alreadySolved: boolean;
  milestone: number | null;
}): number {
  let pts = 0;
  if (!opts.alreadySolved) pts += opts.isCorrect ? POINTS.correct : POINTS.wrong;
  if (opts.milestone) pts += POINTS.streakBonus[opts.milestone] ?? 0;
  return pts;
}
