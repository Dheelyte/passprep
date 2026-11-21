import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { FREE_DAILY_LIMIT } from "@/lib/entitlements";
import { planViews } from "@/lib/plans";
import { checkout } from "@/app/actions/billing";
import { PlanPicker } from "@/components/plan-picker";
import { AskParent } from "@/components/ask-parent";
import { SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Premium" };

const rows: [string, string, string][] = [
  ["Practice questions", `${FREE_DAILY_LIMIT} a day`, "Unlimited"],
  ["Step-by-step explanations", "✓", "✓"],
  ["Video solutions", "A few samples", "Every video"],
  ["Streaks & leaderboard", "✓", "✓"],
  ["Progress tracking", "Basic", "Detailed"],
  ["Past questions & mock exams", "—", "Coming soon"],
];

export default function PremiumPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Practise without limits</h1>
        <p className="muted mt-1">Unlimited questions and every video solution, so you&apos;re never stuck the night before an exam.</p>
      </header>
      <section className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-3 py-2 font-semibold" scope="col"><span className="sr-only">Feature</span></th>
              <th className="px-3 py-2 font-semibold" scope="col">Free</th>
              <th className="px-3 py-2 font-semibold text-brand" scope="col">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([f, a, b]) => (
              <tr key={f}>
                <th scope="row" className="px-3 py-2 text-left font-medium">{f}</th>
                <td className="muted px-3 py-2">{a}</td>
                <td className="px-3 py-2 font-semibold">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Suspense fallback={<SkeletonList rows={4} />}>
        <Plans />
      </Suspense>
      <p className="text-center">
        <Link href="/dashboard" className="muted text-sm underline">Not now — keep practising free</Link>
      </p>
    </div>
  );
}

async function Plans() {
  const user = await requireUser();
  const premium = isPremium(user.subscription);
  const plans = await planViews();
  return (
    <>
      {premium && user.subscription ? (
        <p className="card border-brand bg-brand-soft text-sm">
          ✅ You have Premium until <strong>{user.subscription.currentPeriodEnd.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</strong>.
          {user.subscription.mode === "FIXED_PERIOD" ? " Paying again adds more time." : ""}
        </p>
      ) : null}

      <section id="ask-parent" className="card scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold">Ask a parent to pay</h2>
        <p className="muted text-sm">Send a secure link. Your parent can pay by bank transfer, USSD or card — and your Premium unlocks straight away.</p>
        <AskParent firstName={user.name.split(" ")[0]} />
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Or pay now</h2>
        <PlanPicker plans={plans} action={checkout} defaultEmail={user.email} />
      </section>
    </>
  );
}
