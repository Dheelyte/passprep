"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, readSession } from "@/lib/session";
import { parseIdentifier } from "@/lib/identity";
import { rateLimit } from "@/lib/rate-limit";
import { track } from "@/lib/events";

// Real hash of a random string, compared against when the account doesn't exist (timing safety).
const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), 10);

export type FormState = { error?: string; fields?: Record<string, string> } | undefined;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
}

function safeNext(next: FormDataEntryValue | null): string | null {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(60),
  identifier: z.string().trim().min(5, "Enter your phone number or email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const raw = { name: String(form.get("name") ?? ""), identifier: String(form.get("identifier") ?? ""), password: String(form.get("password") ?? "") };
  const fields = { name: raw.name, identifier: raw.identifier };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  if (!rateLimit(`signup:${await clientIp()}`, 10, 60 * 60_000)) return { error: "Too many sign-ups from this network. Try again later.", fields };

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) return { error: "Enter a valid Nigerian phone number (e.g. 0801 234 5678) or email address.", fields };

  const exists = await db.user.findFirst({ where: id, select: { id: true } });
  if (exists) return { error: "An account with this phone number or email already exists. Log in instead.", fields };

  const user = await db.user.create({
    data: {
      ...id,
      name: parsed.data.name,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      signupSource: String(form.get("source") ?? "").slice(0, 80) || null,
    },
  });
  track("signup", user.id, { method: "email" in id ? "email" : "phone", source: user.signupSource });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const identifier = String(form.get("identifier") ?? "");
  const password = String(form.get("password") ?? "");
  const fields = { identifier };
  const id = parseIdentifier(identifier);
  if (!id || !password) return { error: "Enter your phone number or email and password.", fields };

  const key = `login:${"email" in id ? id.email : id.phone}`;
  if (!rateLimit(key, 8, 15 * 60_000) || !rateLimit(`login-ip:${await clientIp()}`, 40, 15 * 60_000))
    return { error: "Too many attempts. Wait 15 minutes and try again.", fields };

  const user = await db.user.findFirst({ where: id });
  // Always run bcrypt so response time doesn't reveal whether the account exists.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (user && !user.passwordHash) return { error: "This account signs in with Google. Tap “Continue with Google” above.", fields };
  if (!user || !ok) return { error: "Incorrect phone/email or password.", fields };

  await createSession(user.id);
  track("login", user.id);
  const next = safeNext(form.get("next"));
  if (user.role !== "STUDENT") redirect(next ?? "/admin");
  redirect(next ?? (user.onboarded ? "/dashboard" : "/onboarding"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const onboardingSchema = z.object({
  classLevel: z.enum(["JSS3", "SS1", "SS2", "SS3"], { message: "Choose your class" }),
  exams: z.array(z.enum(["WAEC", "NECO", "JAMB"])).min(1, "Choose at least one exam"),
  subjects: z.array(z.string()).min(1, "Choose at least one subject"),
});

export async function completeOnboarding(_: FormState, form: FormData): Promise<FormState> {
  const session = await readSession();
  if (!session) redirect("/login");
  const parsed = onboardingSchema.safeParse({
    classLevel: form.get("classLevel"),
    exams: form.getAll("exams"),
    subjects: form.getAll("subjects"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const valid = await db.subject.findMany({ where: { id: { in: parsed.data.subjects }, isActive: true }, select: { id: true } });
  if (valid.length === 0) return { error: "Choose at least one subject" };

  await db.$transaction([
    db.userSubject.deleteMany({ where: { userId: session.uid } }),
    db.userSubject.createMany({ data: valid.map((s) => ({ userId: session.uid, subjectId: s.id })) }),
    db.user.update({
      where: { id: session.uid },
      data: { classLevel: parsed.data.classLevel, exams: parsed.data.exams, onboarded: true },
    }),
  ]);
  const editing = form.get("mode") === "edit";
  track(editing ? "plan_edited" : "onboarded", session.uid, { classLevel: parsed.data.classLevel, exams: parsed.data.exams, subjects: valid.length });
  redirect(editing ? "/dashboard" : "/dashboard?welcome=1");
}
