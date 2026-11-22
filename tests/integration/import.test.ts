import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { parseCsv, QUESTION_COLUMNS } from "@/lib/import";
import { importQuestions } from "@/lib/import-commit";
import { cleanup, makeStudent } from "./helpers";

const users: string[] = [];
afterAll(async () => {
  await db.question.deleteMany({ where: { authorId: { in: users } } });
  await db.importBatch.deleteMany({ where: { uploaderId: { in: users } } });
  await cleanup(users);
});

describe("question import against the real syllabus", () => {
  it("previews without writing, then imports valid rows as IN_REVIEW and skips duplicates/unknown topics", async () => {
    const teacher = await makeStudent("Import Teacher");
    users.push(teacher.id);
    const stem = `What is ${Math.floor(Math.random() * 1e6)} + 0?`;
    const csv = [
      QUESTION_COLUMNS.join(","),
      `Mathematics,Algebra,Linear equations,easy,"${stem}",1,2,,,,A,"Adding zero leaves a number unchanged.",,`,
      `Mathematics,Algebra,Not a real subtopic,easy,"Another question here?",1,2,,,,A,"Some explanation text.",,`,
      `Mathematics,Algebra,Linear equations,easy,Solve $2x + 3 = 11$.,3,4,7,8,,B,"Already in the bank from the seed.",,`,
    ].join("\n");
    const rows = parseCsv(csv);
    const opts = { commit: false, uploaderId: teacher.id, filename: "t.csv" };

    const preview = await importQuestions(rows, opts);
    expect(preview).toMatchObject({ total: 3, valid: 1 });
    expect(preview.invalid.map((i) => i.errors.join())).toEqual([
      expect.stringMatching(/not found. Import the syllabus first/),
      expect.stringMatching(/already in the question bank/),
    ]);
    expect(await db.question.count({ where: { authorId: teacher.id } })).toBe(0);

    const done = await importQuestions(rows, { ...opts, commit: true });
    expect(done.created).toBe(1);
    const q = await db.question.findFirstOrThrow({ where: { authorId: teacher.id } });
    expect(q).toMatchObject({ status: "IN_REVIEW", options: ["1", "2"], correctIndex: 0, importBatchId: done.batchId });

    // re-importing the same file creates nothing new
    expect((await importQuestions(rows, { ...opts, commit: true })).created ?? 0).toBe(0);
  });
});
