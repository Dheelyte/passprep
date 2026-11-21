import "server-only";
import { db } from "./db";

export const PROGRESS = { window: 20, minAttempts: 5, strong: 0.75, weak: 0.5 };

export type Mastery = "strong" | "ok" | "weak" | "new";

export function classify(correct: number, total: number): Mastery {
  if (total < PROGRESS.minAttempts) return "new";
  const acc = correct / total;
  if (acc >= PROGRESS.strong) return "strong";
  if (acc < PROGRESS.weak) return "weak";
  return "ok";
}

export type TopicProgress = {
  topicId: string;
  name: string;
  order: number;
  attempts: number; // within the recent window
  correct: number;
  accuracy: number | null;
  mastery: Mastery;
};

/**
 * Per top-level topic accuracy over each topic's most recent attempts
 * (subtopic attempts roll up into their parent topic).
 */
export async function subjectProgress(userId: string, subjectId: string): Promise<TopicProgress[]> {
  const topics = await db.topic.findMany({
    where: { subjectId },
    select: { id: true, name: true, order: true, parentId: true },
  });
  const rootOf = new Map(topics.map((t) => [t.id, t.parentId ?? t.id]));

  const rows = await db.$queryRaw<{ root_id: string; total: bigint; correct: bigint }[]>`
    WITH scoped AS (
      SELECT COALESCE(t.parent_id, t.id) AS root_id, a.is_correct,
             ROW_NUMBER() OVER (PARTITION BY COALESCE(t.parent_id, t.id) ORDER BY a.created_at DESC) AS rn
      FROM attempts a
      JOIN questions q ON q.id = a.question_id
      JOIN topics t ON t.id = q.topic_id
      WHERE a.user_id = ${userId} AND t.subject_id = ${subjectId}
    )
    SELECT root_id, COUNT(*) AS total, COUNT(*) FILTER (WHERE is_correct) AS correct
    FROM scoped WHERE rn <= ${PROGRESS.window}
    GROUP BY root_id`;
  const byRoot = new Map(rows.map((r) => [r.root_id, { total: Number(r.total), correct: Number(r.correct) }]));

  return topics
    .filter((t) => rootOf.get(t.id) === t.id)
    .sort((a, b) => a.order - b.order)
    .map((t) => {
      const s = byRoot.get(t.id) ?? { total: 0, correct: 0 };
      return {
        topicId: t.id,
        name: t.name,
        order: t.order,
        attempts: s.total,
        correct: s.correct,
        accuracy: s.total ? s.correct / s.total : null,
        mastery: classify(s.correct, s.total),
      };
    });
}

/** Premium detail: weekly accuracy trend and difficulty breakdown for a subject. */
export async function subjectDetail(userId: string, subjectId: string) {
  const [trend, byDifficulty, missed] = await Promise.all([
    db.$queryRaw<{ week: Date; total: bigint; correct: bigint }[]>`
      SELECT date_trunc('week', a.lagos_date)::date AS week, COUNT(*) AS total,
             COUNT(*) FILTER (WHERE a.is_correct) AS correct
      FROM attempts a JOIN questions q ON q.id = a.question_id JOIN topics t ON t.id = q.topic_id
      WHERE a.user_id = ${userId} AND t.subject_id = ${subjectId}
        AND a.lagos_date >= (CURRENT_DATE - INTERVAL '12 weeks')
      GROUP BY 1 ORDER BY 1`,
    db.$queryRaw<{ difficulty: string; total: bigint; correct: bigint }[]>`
      SELECT q.difficulty::text AS difficulty, COUNT(*) AS total, COUNT(*) FILTER (WHERE a.is_correct) AS correct
      FROM attempts a JOIN questions q ON q.id = a.question_id JOIN topics t ON t.id = q.topic_id
      WHERE a.user_id = ${userId} AND t.subject_id = ${subjectId}
      GROUP BY 1`,
    db.$queryRaw<{ question_id: string; stem: string; topic: string; wrong: bigint }[]>`
      SELECT q.id AS question_id, q.stem, t.name AS topic, COUNT(*) AS wrong
      FROM attempts a JOIN questions q ON q.id = a.question_id JOIN topics t ON t.id = q.topic_id
      WHERE a.user_id = ${userId} AND t.subject_id = ${subjectId} AND NOT a.is_correct
      GROUP BY q.id, q.stem, t.name ORDER BY wrong DESC LIMIT 5`,
  ]);
  const n = (b: bigint) => Number(b);
  return {
    trend: trend.map((r) => ({ week: r.week, total: n(r.total), accuracy: n(r.correct) / n(r.total) })),
    byDifficulty: byDifficulty.map((r) => ({ difficulty: r.difficulty, total: n(r.total), accuracy: n(r.correct) / n(r.total) })),
    missed: missed.map((r) => ({ questionId: r.question_id, stem: r.stem, topic: r.topic, wrong: n(r.wrong) })),
  };
}
