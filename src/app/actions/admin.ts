"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { QUESTION_COLUMNS, SYLLABUS_COLUMNS, missingColumns, parseUpload, stemHash } from "@/lib/import";
import { importQuestions, importSyllabus, type ImportReport } from "@/lib/import-commit";
import { youtubeId } from "@/lib/youtube";

async function staff(...roles: ("TEACHER" | "ADMIN")[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const allowed = roles.length ? roles : ["TEACHER", "ADMIN"];
  if (!allowed.includes(user.role as "TEACHER" | "ADMIN")) redirect("/dashboard");
  return user;
}

export type ImportState = { error?: string; report?: ImportReport; kind?: string; committed?: boolean } | undefined;

const MAX_UPLOAD = 5 * 1024 * 1024;

export async function runImport(_: ImportState, form: FormData): Promise<ImportState> {
  const user = await staff();
  const kind = form.get("kind") === "syllabus" ? "syllabus" : "questions";
  const commit = form.get("intent") === "commit";
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a .csv or .xlsx file to upload.", kind };
  if (file.size > MAX_UPLOAD) return { error: "File is too large (max 5 MB). Split it into smaller files.", kind };
  if (kind === "syllabus" && user.role !== "ADMIN") return { error: "Only admins can change the syllabus.", kind };

  let rows;
  try {
    rows = await parseUpload(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not read the file.", kind };
  }
  if (rows.length === 0) return { error: "The file has no data rows.", kind };
  if (rows.length > 2000) return { error: "Too many rows (max 2,000 per file).", kind };
  const missing = missingColumns(rows, kind === "syllabus" ? SYLLABUS_COLUMNS : QUESTION_COLUMNS);
  if (missing.length) return { error: `Missing columns: ${missing.join(", ")}. Download the template to see the expected headings.`, kind };

  const opts = { commit, uploaderId: user.id, filename: file.name.slice(0, 200) };
  const report = kind === "syllabus" ? await importSyllabus(rows, opts) : await importQuestions(rows, opts);
  if (commit) revalidatePath("/admin");
  return { report, kind, committed: commit };
}

// ---------- Review workflow ----------

export async function reviewQuestion(form: FormData) {
  const user = await staff();
  const id = String(form.get("id") ?? "");
  const decision = form.get("decision");
  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const q = await db.question.findUnique({ where: { id } });
  if (!q || q.status !== "IN_REVIEW") redirect("/admin/review");
  // Second-teacher rule: authors can't approve their own questions (admins can, for emergencies).
  if (q.authorId === user.id && user.role !== "ADMIN") redirect("/admin/review?error=own");

  if (decision === "approve") {
    await db.question.update({ where: { id }, data: { status: "PUBLISHED", reviewerId: user.id, reviewNote: note, publishedAt: new Date() } });
  } else {
    if (!note) redirect(`/admin/review?error=note#q-${id}`);
    await db.question.update({ where: { id }, data: { status: "REJECTED", reviewerId: user.id, reviewNote: note } });
  }
  revalidatePath("/admin/review");
  redirect("/admin/review");
}

const editSchema = z.object({
  id: z.string(),
  topicId: z.string().min(1),
  stem: z.string().trim().min(5, "Question text is too short"),
  options: z.array(z.string().trim()).transform((o) => o.filter(Boolean)).pipe(z.array(z.string()).min(2, "At least two options").max(5)),
  correctIndex: z.coerce.number().int().min(0),
  explanation: z.string().trim().min(10, "Every question needs a step-by-step explanation"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  videoUrl: z.string().trim(),
  videoFree: z.boolean(),
  autoVideoBlocked: z.boolean(),
  autoVideoReset: z.boolean(),
});

export type EditState = { error?: string; saved?: boolean } | undefined;

export async function saveQuestion(_: EditState, form: FormData): Promise<EditState> {
  const user = await staff();
  const parsed = editSchema.safeParse({
    id: form.get("id"),
    topicId: form.get("topicId"),
    stem: form.get("stem"),
    options: ["0", "1", "2", "3", "4"].map((i) => String(form.get(`option${i}`) ?? "")),
    correctIndex: form.get("correctIndex"),
    explanation: form.get("explanation"),
    difficulty: form.get("difficulty"),
    videoUrl: form.get("videoUrl") ?? "",
    videoFree: form.get("videoFree") === "on",
    autoVideoBlocked: form.get("autoVideoBlocked") === "on",
    autoVideoReset: form.get("autoVideoReset") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.correctIndex >= d.options.length) return { error: "The correct answer must be one of the filled options." };
  if (d.videoUrl && !youtubeId(d.videoUrl)) return { error: "Video link must be a YouTube URL." };

  const existing = await db.question.findUnique({ where: { id: d.id } });
  if (!existing) return { error: "Question not found." };
  // Teachers' edits to live content go back through review; admins can hot-fix.
  const status = user.role === "ADMIN" ? existing.status : existing.status === "DRAFT" ? "DRAFT" : "IN_REVIEW";
  // A new question text or topic (or a teacher asking) means the saved YouTube match may be wrong: search again next time.
  const researchVideo = d.autoVideoReset || d.stem !== existing.stem || d.topicId !== existing.topicId;
  try {
    await db.question.update({
      where: { id: d.id },
      data: {
        topicId: d.topicId,
        stem: d.stem,
        stemHash: stemHash(d.stem),
        options: d.options,
        correctIndex: d.correctIndex,
        explanation: d.explanation,
        difficulty: d.difficulty,
        videoUrl: d.videoUrl || null,
        videoFree: d.videoFree,
        autoVideoBlocked: d.autoVideoBlocked,
        ...(researchVideo ? { autoVideoId: null, autoVideoTitle: null, autoVideoChannel: null, autoVideoAt: null } : {}),
        status,
        ...(status === "IN_REVIEW" && existing.status !== "IN_REVIEW" ? { authorId: user.id, reviewerId: null } : {}),
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { error: "Another question in this topic has the same text." };
    throw e;
  }
  revalidatePath(`/admin/questions/${d.id}`);
  return { saved: true };
}

export async function setFlagStatus(form: FormData) {
  await staff();
  const id = String(form.get("id") ?? "");
  const status = form.get("status") === "RESOLVED" ? "RESOLVED" : "DISMISSED";
  await db.flag.update({ where: { id }, data: { status } });
  revalidatePath("/admin/flags");
}

export async function unpublishQuestion(form: FormData) {
  await staff("ADMIN");
  const id = String(form.get("id") ?? "");
  await db.question.update({ where: { id }, data: { status: "DRAFT" } });
  revalidatePath(`/admin/questions/${id}`);
}
