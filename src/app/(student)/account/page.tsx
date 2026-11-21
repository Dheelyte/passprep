import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { logout } from "@/app/actions/auth";
import { CancelRenewal } from "@/components/cancel-renewal";
import { PageHeader, SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Account" };

const CLASS_LABEL: Record<string, string> = { JSS3: "JSS 3", SS1: "SS 1", SS2: "SS 2", SS3: "SS 3" };
const PLAN: Record<string, string> = { MONTHLY: "Monthly", TERMLY: "Per term", YEARLY: "Yearly", EXAM_PASS: "Exam season pass" };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" />
      <Suspense fallback={<SkeletonList rows={3} />}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const user = await requireUser({ allowUnonboarded: true });
  const sub = user.subscription;
  const premium = isPremium(sub);
  const fmt = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="space-y-4">
      <section className="card space-y-1">
        <p className="text-lg font-semibold">{user.name}</p>
        <p className="muted text-sm">{user.phone ?? user.email}</p>
        <p className="muted text-sm">
          {user.classLevel ? CLASS_LABEL[user.classLevel] : "Class not set"} · {user.exams.join(", ") || "No exams chosen"}
        </p>
        <Link href="/onboarding" className="text-sm font-semibold text-brand">Change class, exams or subjects</Link>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Plan</h2>
        {premium && sub ? (
          <>
            <p className="text-sm">
              <span className="chip bg-brand-soft text-brand">Premium</span> {PLAN[sub.plan]} ·{" "}
              {sub.mode === "AUTO_RENEW" && sub.status === "ACTIVE" ? `renews on ${fmt(sub.currentPeriodEnd)}` : `ends on ${fmt(sub.currentPeriodEnd)}`}
            </p>
            {sub.mode === "AUTO_RENEW" && sub.status === "ACTIVE" ? <CancelRenewal /> : <Link href="/premium" className="btn-secondary w-full">Add more time</Link>}
          </>
        ) : (
          <>
            <p className="muted text-sm">Free plan{sub ? ` · Premium ended on ${fmt(sub.currentPeriodEnd)}` : ""}</p>
            <Link href="/premium" className="btn-accent w-full">See Premium</Link>
          </>
        )}
      </section>

      {user.role !== "STUDENT" ? <Link href="/admin" className="btn-secondary w-full">Content admin</Link> : null}

      <form action={logout}>
        <button className="btn-ghost w-full">Log out</button>
      </form>
    </div>
  );
}
