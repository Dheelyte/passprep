import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { planViews } from "@/lib/plans";
import { checkoutViaPayLink } from "@/app/actions/billing";
import { PlanPicker } from "@/components/plan-picker";
import { PublicShell } from "@/components/public-shell";
import { Avatar, Card, EmptyState, Flame, SkeletonList } from "@/components/ds";
import { FREE_DAILY_LIMIT } from "@/lib/entitlements";
import { publicName } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Pay for Premium", robots: { index: false } };

export default function PayPage({ params }: PageProps<"/pay/[token]">) {
  return (
    <PublicShell wide>
      <Suspense fallback={<SkeletonList rows={5} />}>
        <Pay params={params} />
      </Suspense>
    </PublicShell>
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
      <div className="mx-auto max-w-md">
        <EmptyState kind="lost" title="This link has expired" body="Ask your child to create a new payment link from their Premium page. It only takes a second." />
      </div>
    );
  }
  const name = publicName(link.student.name);
  const plans = await planViews();
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-8">
      {/* Left: whose Premium this is and how they're doing. Right: the plan form, kept in view on desktop. */}
      <div className="space-y-5">
        <Card className="flex items-center gap-4">
          <Avatar name={link.student.name} size="lg" />
          <div>
            <p className="text-sm font-bold text-ink-2">Premium for</p>
            <h1 className="text-2xl font-extrabold">Unlock Premium for {name}</h1>
          </div>
        </Card>
        <dl className="grid grid-cols-2 gap-3">
          <div className="sticker px-3 py-3 text-center">
            <dt className="text-xs font-bold text-ink-2">Questions practised</dt>
            <dd className="num mt-1 text-3xl">{link.student._count.attempts}</dd>
          </div>
          <div className="sticker flex flex-col items-center px-3 py-3">
            <dt className="text-xs font-bold text-ink-2">Current streak</dt>
            <dd className="mt-1 flex items-center gap-1"><Flame days={link.student.currentStreak} size={24} /><span className="num text-3xl">{link.student.currentStreak}</span></dd>
          </div>
        </dl>
        <p>
          On the free plan, {name} can answer {FREE_DAILY_LIMIT} questions a day. Premium gives unlimited WAEC, NECO and JAMB practice and every video solution.
        </p>
      </div>
      <div className="space-y-3 lg:sticky lg:top-6">
        <Card>
          <PlanPicker plans={plans} action={checkoutViaPayLink} token={token} submitLabel="Pay securely" />
        </Card>
        <p className="muted text-center text-xs">You&apos;ll get a receipt by email. Transfer and USSD plans don&apos;t renew automatically.</p>
      </div>
    </div>
  );
}
