import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { planViews } from "@/lib/plans";
import { checkoutViaPayLink } from "@/app/actions/billing";
import { PlanPicker } from "@/components/plan-picker";
import { Logo } from "@/components/logo";
import { SkeletonList } from "@/components/ui";
import { FREE_DAILY_LIMIT } from "@/lib/entitlements";
import { publicName } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Pay for Premium", robots: { index: false } };

export default function PayPage({ params }: PageProps<"/pay/[token]">) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="mb-6"><Logo /></div>
      <Suspense fallback={<SkeletonList rows={5} />}>
        <Pay params={params} />
      </Suspense>
    </div>
  );
}

async function Pay({ params }: { params: PageProps<"/pay/[token]">["params"] }) {
  const { token } = await params;
  const link = await db.payLink.findUnique({
    where: { token },
    include: { student: { select: { name: true, currentStreak: true, _count: { select: { attempts: true } } } } },
  });
  if (!link) notFound();
  if (link.expiresAt < new Date()) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold">This link has expired</h1>
        <p className="muted mt-1">Ask your child to create a new payment link from the Premium page.</p>
      </div>
    );
  }
  const name = publicName(link.student.name);
  const plans = await planViews();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Unlock Premium for {name}</h1>
        <p className="muted mt-1">
          {name} has answered <strong className="text-text">{link.student._count.attempts}</strong> practice questions so far.
          On the free plan they can do {FREE_DAILY_LIMIT} a day. Premium gives unlimited WAEC, NECO and JAMB practice and every video solution.
        </p>
      </header>
      <section className="card">
        <PlanPicker plans={plans} action={checkoutViaPayLink} token={token} submitLabel="Pay securely" />
      </section>
      <p className="muted text-center text-xs">You&apos;ll get a receipt by email. Bank transfer and USSD plans don&apos;t renew automatically.</p>
    </div>
  );
}
