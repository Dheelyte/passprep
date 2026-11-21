// HTTP smoke test: every page renders for a signed-in student / staff member.
// Usage: dev server on :3100 (with mock Paystack on :3199), then `npx tsx tests/smoke.mts`.
import { SignJWT } from "jose";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3100";
const db = new PrismaClient();
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
const cookie = async (uid: string) =>
  `pp_session=${await new SignJWT({ uid }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(secret)}`;

let failures = 0;
async function check(path: string, opts: { cookie?: string; expect: (string | RegExp)[]; status?: number; method?: string; body?: string; headers?: Record<string, string> }) {
  const t = Date.now();
  let res: Response | undefined;
  // Dev mode compiles each route on first hit; on a small machine that can exceed fetch's
  // 5-minute header timeout, so retry (the server keeps compiling and caches the result).
  for (let attempt = 1; !res; attempt++) {
    try {
      res = await fetch(BASE + path, {
        method: opts.method ?? "GET",
        body: opts.body,
        redirect: "manual",
        headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), ...(opts.headers ?? {}) },
      });
    } catch (e) {
      if (attempt >= 4) throw e;
      console.log(`  retry ${path} (${(e as Error).message})`);
    }
  }
  const text = (await res.text()).replaceAll("<!-- -->", "");
  const missing = opts.expect.filter((e) => (typeof e === "string" ? !text.includes(e) : !e.test(text)));
  const ok = res.status === (opts.status ?? 200) && missing.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${res.status} ${path} (${Date.now() - t}ms)${missing.length ? ` missing: ${missing.join(" | ")}` : ""}`);
  return { res, text };
}

const tobi = await db.user.findUniqueOrThrow({ where: { phone: "+2348012345678" } });
const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@example.com" } });
const s = await cookie(tobi.id);
const a = await cookie(admin.id);
const topic = await db.topic.findFirstOrThrow({ where: { slug: "number-and-numeration--logarithms" } });
const session = await db.practiceSession.create({
  data: { userId: tobi.id, topicId: topic.id, questionIds: (await db.question.findMany({ where: { topicId: topic.id }, select: { id: true } })).map((q) => q.id) },
});
const link = await db.payLink.create({ data: { studentId: tobi.id, token: `smoke${Date.now()}`, expiresAt: new Date(Date.now() + 86_400_000) } });

await check("/", { expect: ["Master every WAEC, NECO and JAMB topic", "katex"] });
await check("/login", { expect: ["Welcome back"] });
await check("/signup?utm_source=whatsapp", { expect: ["Start practising for free", 'value="whatsapp"'] });
await check("/dashboard", { status: 307, expect: [] }); // signed out → proxy redirect
await check("/dashboard", { cookie: s, expect: ["Hi Tobi", "Daily streak", "This week", "Your subjects"] });
await check("/subjects", { cookie: s, expect: ["Mathematics", "Physics", "My subject"] });
await check("/subjects/mathematics", { cookie: s, expect: ["Number and Numeration", "Logarithms", "Practise"] });
await check(`/practice/${session.id}`, { cookie: s, expect: ["Question 1 of 3", "katex"] });
await check("/leaderboard", { cookie: s, expect: ["This week", "Chidinma O.", "left this week"] });
await check("/progress", { cookie: s, expect: ["Your progress", "Mathematics"] });
await check("/progress/mathematics", { cookie: s, expect: ["Topics", "Detailed progress"] });
await check("/premium", { cookie: s, expect: ["Practise without limits", "Ask a parent to pay", "Per term"] });
await check("/account", { cookie: s, expect: ["Tobi Adebayo", "+2348012345678", "Free plan"] });
await check(`/pay/${link.token}`, { expect: ["Unlock Premium for Tobi A.", "Pay securely"] });
await check("/pay/does-not-exist", { expect: [/could not be found/] }); // streamed → 200 with not-found UI
await check("/admin", { cookie: s, status: 200, expect: [/NEXT_REDIRECT|\/dashboard/] }); // students bounced
await check("/admin", { cookie: a, expect: ["Content overview", "Published"] });
await check("/admin/import", { cookie: a, expect: ["Bulk import", "questions-template.csv"] });
await check("/admin/review", { cookie: await cookie(teacher.id), expect: ["Review queue"] });
await check("/admin/questions?sort=missed", { cookie: a, expect: ["Question bank"] });
const q = await db.question.findFirstOrThrow({ where: { status: "PUBLISHED" } });
await check(`/admin/questions/${q.id}`, { cookie: a, expect: ["Save changes", "as students see it"] });
await check("/admin/flags", { cookie: a, expect: ["Student reports"] });
await check("/admin/metrics", { cookie: a, expect: ["Success metrics", "Retention by signup week", "Decision rule"] });
await check("/templates/questions-template.csv", { expect: ["subject,topic,subtopic"] });
await check("/manifest.webmanifest", { expect: ["standalone"] });

// Paystack endpoints
const body = JSON.stringify({ event: "subscription.not_renew", data: { subscription_code: "SUB_none" } });
await check("/api/paystack/webhook", { method: "POST", body, headers: { "x-paystack-signature": "00" }, status: 401, expect: ["invalid signature"] });
const sig = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");
await check("/api/paystack/webhook", { method: "POST", body, headers: { "x-paystack-signature": sig }, expect: ['"ok":true'] });
const v = await check("/api/paystack/verify?reference=pp_unknown_ref", { status: 307, expect: [] });
console.log("  verify redirects to", v.res.headers.get("location"));

await db.practiceSession.delete({ where: { id: session.id } });
await db.payLink.delete({ where: { id: link.id } });
await db.$disconnect();
console.log(failures ? `\n${failures} FAILED` : "\nall smoke checks passed");
process.exit(failures ? 1 : 0);
