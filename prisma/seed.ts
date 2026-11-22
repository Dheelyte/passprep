// Dev/demo seed. Loads content through the same importer teachers use.
// Run: npm run db:seed
//
// Production (content only, no demo accounts, existing prices kept):
//   DATABASE_URL="<production url>" npm run db:seed:content
// Needs an admin first: npm run db:create-admin -- you@example.com "long-password"
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { parseCsv } from "../src/lib/import";
import { importQuestions, importSyllabus } from "../src/lib/import-commit";
import { lagosWeekStart } from "../src/lib/time";

const db = new PrismaClient();
const here = path.dirname(new URL(import.meta.url).pathname);

const CONTENT_ONLY = process.env.SEED_CONTENT_ONLY === "1";

async function main() {
  // Prices are PLACEHOLDERS until pricing is set after parent interviews (see product plan).
  const plans = [
    { code: "MONTHLY", name: "Monthly", amountKobo: 1_500_00, periodDays: 30, paystackPlan: process.env.PAYSTACK_PLAN_MONTHLY ?? null },
    { code: "TERMLY", name: "Per term", amountKobo: 4_000_00, periodDays: 120, paystackPlan: process.env.PAYSTACK_PLAN_TERMLY ?? null },
    { code: "YEARLY", name: "Yearly", amountKobo: 10_000_00, periodDays: 365, paystackPlan: process.env.PAYSTACK_PLAN_YEARLY ?? null },
    { code: "EXAM_PASS", name: "Exam season pass", amountKobo: 3_000_00, periodDays: 90, paystackPlan: null },
  ] as const;
  // In production never overwrite prices someone has already set.
  for (const p of plans) await db.planPrice.upsert({ where: { code: p.code }, create: p, update: CONTENT_ONLY ? {} : p });

  if (CONTENT_ONLY) {
    const admin = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
    if (!admin) throw new Error('No admin yet. Run: npm run db:create-admin -- you@example.com "a-long-password"');
    await loadContent(admin.id, admin.id);
    console.log(`content loaded as ${admin.email}. No demo accounts were created.`);
    return;
  }

  const hash = await bcrypt.hash("password123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    create: { email: "admin@example.com", name: "Admin", passwordHash: hash, role: "ADMIN", onboarded: true },
    update: {},
  });
  const reviewer = await db.user.upsert({
    where: { email: "reviewer@example.com" },
    create: { email: "reviewer@example.com", name: "Mrs Adeyemi", passwordHash: hash, role: "TEACHER", onboarded: true },
    update: {},
  });
  await db.user.upsert({
    where: { email: "teacher@example.com" },
    create: { email: "teacher@example.com", name: "Mr Okafor", passwordHash: hash, role: "TEACHER", onboarded: true },
    update: {},
  });

  await loadContent(admin.id, reviewer.id);

  // Demo student + a few classmates so the leaderboard isn't empty in development.
  if (process.env.NODE_ENV !== "production") {
    const maths = await db.subject.findUniqueOrThrow({ where: { slug: "mathematics" } });
    const physics = await db.subject.findUniqueOrThrow({ where: { slug: "physics" } });
    const tobi = await db.user.upsert({
      where: { phone: "+2348012345678" },
      create: {
        phone: "+2348012345678",
        name: "Tobi Adebayo",
        passwordHash: hash,
        classLevel: "SS2",
        exams: ["WAEC", "JAMB"],
        onboarded: true,
        subjects: { create: [{ subjectId: maths.id }, { subjectId: physics.id }] },
      },
      update: {},
    });
    const weekStart = lagosWeekStart();
    const names = ["Chidinma Okeke", "Ibrahim Musa", "Funke Alabi", "Emeka Nwosu", "Aisha Bello", "Tunde Bakare", "Ngozi Eze"];
    for (const [i, name] of names.entries()) {
      const u = await db.user.upsert({
        where: { email: `demo${i + 1}@example.com` },
        create: { email: `demo${i + 1}@example.com`, name, passwordHash: hash, classLevel: i % 2 ? "SS3" : "SS2", exams: ["WAEC"], onboarded: true, currentStreak: 7 - i, longestStreak: 7 - i, lastActiveDate: new Date(), totalPoints: 400 - i * 45 },
        update: {},
      });
      await db.weeklyScore.upsert({
        where: { userId_weekStart: { userId: u.id, weekStart } },
        create: { userId: u.id, weekStart, points: 320 - i * 40, answered: 30 - i * 3 },
        update: {},
      });
    }
    console.log(`demo student: phone 08012345678 / password123 (id ${tobi.id})`);
  }
  console.log("staff logins: admin@example.com, teacher@example.com, reviewer@example.com / password123");
}

/** Syllabus + sample questions through the teacher importer; seed questions are pre-reviewed. */
async function loadContent(uploaderId: string, reviewerId: string) {
  const syllabus = parseCsv(readFileSync(path.join(here, "seed-data/syllabus.csv"), "utf8"));
  const s = await importSyllabus(syllabus, { commit: true, uploaderId, filename: "syllabus.csv" });
  console.log(`syllabus: ${s.created}/${s.total} rows`, s.invalid.length ? s.invalid : "");

  const questions = parseCsv(readFileSync(path.join(here, "seed-data/questions.csv"), "utf8"));
  const q = await importQuestions(questions, { commit: true, uploaderId: uploaderId, filename: "questions.csv" });
  console.log(`questions: ${q.created ?? 0} new, ${q.invalid.length} skipped`);
  for (const i of q.invalid) if (!i.errors.join().includes("already in the question bank")) console.log("  line", i.line, i.errors);

  // Seed content is pre-reviewed: publish it.
  await db.question.updateMany({
    where: { status: "IN_REVIEW", importBatchId: q.batchId ?? "-" },
    data: { status: "PUBLISHED", reviewerId: reviewerId, publishedAt: new Date() },
  });

  await db.subject.updateMany({ where: { slug: "mathematics" }, data: { order: 1 } });
  await db.subject.updateMany({ where: { slug: "physics" }, data: { order: 2 } });
  await db.subject.updateMany({ where: { slug: "chemistry" }, data: { order: 3 } });
  await db.subject.updateMany({ where: { slug: "biology" }, data: { order: 4 } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
