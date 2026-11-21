import { spawn, type ChildProcess } from "node:child_process";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function makeStudent(name = "Integration Student") {
  const phone = `+23480${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
  return db.user.create({
    data: { phone, name, passwordHash: await bcrypt.hash("x", 4), classLevel: "SS2", exams: ["WAEC"], onboarded: true },
  });
}

export async function topicBySlug(slug: string) {
  const maths = await db.subject.findUniqueOrThrow({ where: { slug: "mathematics" } });
  return db.topic.findUniqueOrThrow({ where: { subjectId_slug: { subjectId: maths.id, slug } } });
}

export async function startMockPaystack(): Promise<ChildProcess> {
  const child = spawn("node", ["tests/e2e/mock-paystack.mjs"], { env: { ...process.env }, stdio: "pipe" });
  await new Promise<void>((resolve, reject) => {
    child.stdout!.on("data", (d) => String(d).includes("mock paystack") && resolve());
    child.on("exit", (c) => reject(new Error(`mock exited ${c}`)));
  });
  return child;
}

export async function cleanup(userIds: string[]) {
  await db.event.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
}
