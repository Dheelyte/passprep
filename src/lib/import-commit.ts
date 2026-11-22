import "server-only";
import { db } from "./db";
import {
  markInFileDuplicates,
  questionRow,
  slugify,
  syllabusRow,
  validateRows,
  type QuestionRow,
  type RawRow,
  type RowResult,
  type SyllabusRow,
} from "./import";

export type ImportReport = {
  total: number;
  valid: number;
  invalid: { line: number; errors: string[] }[];
  sample: { line: number; summary: string }[];
  created?: number;
  batchId?: string;
};

const subtopicSlug = (topic: string, sub: string) => `${slugify(topic)}--${slugify(sub)}`;

// ---------- Syllabus ----------

export async function importSyllabus(rows: RawRow[], opts: { commit: boolean; uploaderId: string; filename: string }): Promise<ImportReport> {
  const results = validateRows<SyllabusRow>(rows, syllabusRow);
  const ok = results.filter((r): r is Extract<RowResult<SyllabusRow>, { ok: true }> => r.ok);
  const report: ImportReport = {
    total: rows.length,
    valid: ok.length,
    invalid: results.filter((r) => !r.ok).map((r) => ({ line: r.line, errors: (r as { errors: string[] }).errors })),
    sample: ok.slice(0, 8).map((r) => ({ line: r.line, summary: [r.data.subject, r.data.topic, r.data.subtopic].filter(Boolean).join(" › ") })),
  };
  if (!opts.commit || ok.length === 0) return report;

  let created = 0;
  await db.$transaction(
    async (t) => {
      for (const { data: r } of ok) {
        const subject = await t.subject.upsert({
          where: { slug: slugify(r.subject) },
          create: { slug: slugify(r.subject), name: r.subject },
          update: {},
        });
        const topicData = { name: r.topic, classLevels: r.class_levels, exams: r.exams };
        const topic = await t.topic.upsert({
          where: { subjectId_slug: { subjectId: subject.id, slug: slugify(r.topic) } },
          create: { subjectId: subject.id, slug: slugify(r.topic), order: r.subtopic ? 0 : r.order, ...topicData },
          update: r.subtopic ? {} : { order: r.order, ...topicData },
        });
        if (r.subtopic) {
          await t.topic.upsert({
            where: { subjectId_slug: { subjectId: subject.id, slug: subtopicSlug(r.topic, r.subtopic) } },
            create: {
              subjectId: subject.id,
              parentId: topic.id,
              slug: subtopicSlug(r.topic, r.subtopic),
              name: r.subtopic,
              order: r.order,
              classLevels: r.class_levels,
              exams: r.exams,
            },
            update: { name: r.subtopic, order: r.order, classLevels: r.class_levels, exams: r.exams },
          });
        }
        created++;
      }
      const batch = await t.importBatch.create({
        data: { uploaderId: opts.uploaderId, filename: opts.filename, kind: "syllabus", rowCount: rows.length, created },
      });
      report.batchId = batch.id;
    },
    { timeout: 60_000 },
  );
  report.created = created;
  return report;
}

// ---------- Questions ----------

async function resolveTopics() {
  const subjects = await db.subject.findMany({ include: { topics: { select: { id: true, slug: true } } } });
  const map = new Map<string, string>(); // "subject/topic-or-subtopic-slug" → topicId
  for (const s of subjects) for (const t of s.topics) map.set(`${s.slug}/${t.slug}`, t.id);
  return (r: QuestionRow) =>
    map.get(`${slugify(r.subject)}/${r.subtopic ? subtopicSlug(r.topic, r.subtopic) : slugify(r.topic)}`) ?? null;
}

export async function importQuestions(rows: RawRow[], opts: { commit: boolean; uploaderId: string; filename: string }): Promise<ImportReport> {
  let results = markInFileDuplicates(validateRows<QuestionRow>(rows, questionRow));

  // DB-level checks: topic exists, not already in the bank.
  const okRows = results.filter((r) => r.ok).map((r) => (r as { data: QuestionRow }).data);
  const topicFor = await resolveTopics();
  const existing = await db.question.findMany({
    where: { stemHash: { in: okRows.map((r) => r.stemHash) } },
    select: { topicId: true, stemHash: true },
  });
  const existingKeys = new Set(existing.map((e) => `${e.topicId}/${e.stemHash}`));

  const resolved: { line: number; data: QuestionRow; topicId: string }[] = [];
  results = results.map((r) => {
    if (!r.ok) return r;
    const topicId = topicFor(r.data);
    if (!topicId)
      return {
        line: r.line,
        ok: false,
        raw: {},
        errors: [`topic "${[r.data.subject, r.data.topic, r.data.subtopic].filter(Boolean).join(" › ")}" not found. Import the syllabus first`],
      };
    if (existingKeys.has(`${topicId}/${r.data.stemHash}`))
      return { line: r.line, ok: false, raw: {}, errors: ["this question is already in the question bank"] };
    resolved.push({ line: r.line, data: r.data, topicId });
    return r;
  });

  const report: ImportReport = {
    total: rows.length,
    valid: resolved.length,
    invalid: results.filter((r) => !r.ok).map((r) => ({ line: r.line, errors: (r as { errors: string[] }).errors })),
    sample: resolved.slice(0, 8).map((r) => ({
      line: r.line,
      summary: `${r.data.topic}${r.data.subtopic ? ` › ${r.data.subtopic}` : ""} · ${r.data.difficulty.toLowerCase()} · ${r.data.stem.slice(0, 80)}`,
    })),
  };
  if (!opts.commit || resolved.length === 0) return report;

  const batch = await db.importBatch.create({
    data: { uploaderId: opts.uploaderId, filename: opts.filename, kind: "questions", rowCount: rows.length },
  });
  const res = await db.question.createMany({
    data: resolved.map(({ data: q, topicId }) => ({
      topicId,
      stem: q.stem,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      videoUrl: q.videoUrl,
      videoFree: q.videoFree,
      stemHash: q.stemHash,
      status: "IN_REVIEW" as const,
      authorId: opts.uploaderId,
      importBatchId: batch.id,
    })),
    skipDuplicates: true,
  });
  await db.importBatch.update({ where: { id: batch.id }, data: { created: res.count } });
  report.created = res.count;
  report.batchId = batch.id;
  return report;
}
