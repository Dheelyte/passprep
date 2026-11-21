import { createHash } from "node:crypto";
import Papa from "papaparse";
import { z } from "zod";
import { youtubeId } from "./youtube";

// Spreadsheet import for teachers. Two sheets/templates:
//   syllabus:  subject, topic, subtopic, order, class_levels, exams
//   questions: subject, topic, subtopic, difficulty, question, option_a..option_e,
//              correct, explanation, video_url, video_free

export const QUESTION_COLUMNS = [
  "subject", "topic", "subtopic", "difficulty", "question",
  "option_a", "option_b", "option_c", "option_d", "option_e",
  "correct", "explanation", "video_url", "video_free",
] as const;

export const SYLLABUS_COLUMNS = ["subject", "topic", "subtopic", "order", "class_levels", "exams"] as const;

export type RawRow = Record<string, string>;

const CLASS_LEVELS = ["JSS3", "SS1", "SS2", "SS3"] as const;
const EXAMS = ["WAEC", "NECO", "JAMB"] as const;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function stemHash(stem: string): string {
  const norm = stem.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

const listOf = <T extends string>(allowed: readonly T[]) =>
  z
    .string()
    .default("")
    .transform((s) => s.split(/[,;/|]/).map((x) => x.trim().toUpperCase().replace(/\s+/g, "")).filter(Boolean))
    .pipe(z.array(z.enum(allowed as unknown as [T, ...T[]])));

const truthy = z
  .string()
  .default("")
  .transform((s) => ["yes", "y", "true", "1"].includes(s.trim().toLowerCase()));

export const syllabusRow = z.object({
  subject: z.string().trim().min(1, "subject is required"),
  topic: z.string().trim().min(1, "topic is required"),
  subtopic: z.string().trim().default(""),
  order: z
    .string()
    .default("")
    .transform((s, ctx) => {
      if (!s.trim()) return 0;
      const n = Number(s);
      if (!Number.isFinite(n)) ctx.addIssue({ code: "custom", message: "order must be a number" });
      return Math.round(n);
    }),
  class_levels: listOf(CLASS_LEVELS),
  exams: listOf(EXAMS),
});
export type SyllabusRow = z.infer<typeof syllabusRow>;

export const questionRow = z
  .object({
    subject: z.string().trim().min(1, "subject is required"),
    topic: z.string().trim().min(1, "topic is required"),
    subtopic: z.string().trim().default(""),
    difficulty: z
      .string()
      .trim()
      .default("medium")
      .transform((s) => (s || "medium").toUpperCase())
      .pipe(z.enum(["EASY", "MEDIUM", "HARD"], { message: "difficulty must be easy, medium or hard" })),
    question: z.string().trim().min(5, "question text is too short"),
    option_a: z.string().trim().default(""),
    option_b: z.string().trim().default(""),
    option_c: z.string().trim().default(""),
    option_d: z.string().trim().default(""),
    option_e: z.string().trim().default(""),
    correct: z.string().trim().toUpperCase().pipe(z.enum(["A", "B", "C", "D", "E"], { message: "correct must be A–E" })),
    explanation: z.string().trim().min(10, "every question needs a step-by-step explanation"),
    video_url: z.string().trim().default(""),
    video_free: truthy,
  })
  .transform((r, ctx) => {
    const letters = ["a", "b", "c", "d", "e"] as const;
    const raw = letters.map((l) => r[`option_${l}`]);
    // options must be contiguous from A (no gap like A,B,,D)
    const lastFilled = raw.findLastIndex((o) => o !== "");
    const options = raw.slice(0, lastFilled + 1);
    if (options.some((o) => o === "")) ctx.addIssue({ code: "custom", message: "options must be filled in order from A with no gaps" });
    if (options.length < 2) ctx.addIssue({ code: "custom", message: "at least two options (A and B) are required" });
    const correctIndex = "ABCDE".indexOf(r.correct);
    if (correctIndex >= options.length) ctx.addIssue({ code: "custom", message: `correct answer ${r.correct} has no option text` });
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
      ctx.addIssue({ code: "custom", message: "two options have the same text" });
    if (r.video_url && !youtubeId(r.video_url)) ctx.addIssue({ code: "custom", message: "video_url is not a valid YouTube link" });
    return {
      subject: r.subject,
      topic: r.topic,
      subtopic: r.subtopic,
      difficulty: r.difficulty,
      stem: r.question,
      options,
      correctIndex,
      explanation: r.explanation,
      videoUrl: r.video_url || null,
      videoFree: r.video_free,
      stemHash: stemHash(r.question),
    };
  });
export type QuestionRow = z.infer<typeof questionRow>;

export type RowResult<T> = { line: number; ok: true; data: T } | { line: number; ok: false; errors: string[]; raw: RawRow };

function normaliseHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseCsv(text: string): RawRow[] {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normaliseHeader,
  });
  return res.data.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, (v ?? "").toString()])));
}

export async function parseXlsx(buf: ArrayBuffer): Promise<RawRow[]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = normaliseHeader(String(cell.text ?? ""));
  });
  const rows: RawRow[] = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const r: RawRow = {};
    headers.forEach((h, col) => {
      if (h) r[h] = String(row.getCell(col).text ?? "").trim();
    });
    if (Object.values(r).some((v) => v !== "")) rows.push(r);
  });
  return rows;
}

export async function parseUpload(file: { name: string; arrayBuffer(): Promise<ArrayBuffer> }): Promise<RawRow[]> {
  const buf = await file.arrayBuffer();
  if (/\.xlsx$/i.test(file.name)) return parseXlsx(buf);
  if (/\.csv$/i.test(file.name)) return parseCsv(new TextDecoder().decode(buf));
  throw new Error("Upload a .csv or .xlsx file");
}

export function missingColumns(rows: RawRow[], required: readonly string[]): string[] {
  if (rows.length === 0) return [];
  const have = new Set(Object.keys(rows[0]));
  return required.filter((c) => !have.has(c));
}

export function validateRows<T>(rows: RawRow[], schema: z.ZodType<T, RawRow>): RowResult<T>[] {
  return rows.map((raw, i) => {
    const r = schema.safeParse(raw);
    const line = i + 2; // header is line 1
    if (r.success) return { line, ok: true, data: r.data };
    return { line, ok: false, raw, errors: r.error.issues.map((iss) => (iss.path.length ? `${iss.path.join(".")}: ${iss.message}` : iss.message)) };
  });
}

/** Flag duplicate questions inside the same file (same topic path + same stem). */
export function markInFileDuplicates(results: RowResult<QuestionRow>[]): RowResult<QuestionRow>[] {
  const seen = new Map<string, number>();
  return results.map((r) => {
    if (!r.ok) return r;
    const key = `${slugify(r.data.subject)}/${slugify(r.data.topic)}/${slugify(r.data.subtopic)}/${r.data.stemHash}`;
    const first = seen.get(key);
    if (first) return { line: r.line, ok: false, raw: {}, errors: [`duplicate of line ${first}`] };
    seen.set(key, r.line);
    return r;
  });
}
