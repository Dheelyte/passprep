import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, Minus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { FREE_DAILY_LIMIT, isPremium } from "@/lib/entitlements";
import { planViews } from "@/lib/plans";
import { checkout } from "@/app/actions/billing";
import { PlanPicker } from "@/components/plan-picker";
import { AskParent } from "@/components/ask-parent";
import { ButtonLink, Card, ScreenHeader, SkeletonList, Underline } from "@/components/ds";

export const metadata: Metadata = { title: "Premium" };

const rows: [string, string | boolean, string | boolean][] = [
  ["Practice questions", `${FREE_DAILY_LIMIT} a day`, "Unlimited"],
  ["Step-by-step workings", true, true],
  ["Video solutions", "A few samples", "Every one"],
  ["Streaks & leaderboard", true, true],
  ["Progress tracking", "Basic", "Detailed"],
  ["Past questions & mock exams", false, "Coming soon"],
];

function Cell({ v, strong }: { v: string | boolean; strong?: boolean }) {
  if (v === true) return <span className="inline-flex items-center gap-1"><Check aria-hidden className="size-4 text-ok-ink" strokeWidth={3} /><span className="sr-only">Included</span></span>;
  if (v === false) return <span className="inline-flex items-center text-ink-2"><Minus aria-hidden className="size-4" /><span className="sr-only">Not included</span></span>;
  return <span className={strong ? "font-bold" : "text-ink-2"}>{v}</span>;
}

export default function PremiumPage() {
  return (
    <div className="space-y-6">
      <ScreenHeader
        tone="grape"
        className="mb-0"
        eyebrow={<span className="inline-block rounded-full border-2 border-line bg-sun px-3 py-0.5 font-display text-sm font-extrabold uppercase tracking-widest text-on-fill">Premium</span>}
        title={<>Practise <Underline>without limits</Underline></>}
        subtitle="Unlimited questions and every video solution, so you're never stuck the night before the paper."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
      <div className="sticker overflow-hidden p-0 lg:sticky lg:top-8">
        <table className="w-full text-sm">
          <caption className="sr-only">Free vs Premium</caption>
          <thead>
            <tr className="border-b-2 border-line">
              <th scope="col" className="px-3 py-2.5 text-left"><span className="sr-only">Feature</span></th>
              <th scope="col" className="px-3 py-2.5 text-left font-display font-extrabold">Free</th>
              <th scope="col" className="bg-grape px-3 py-2.5 text-left font-display font-extrabold text-on-grape">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-rule">
            {rows.map(([f, a, b]) => (
              <tr key={f}>
                <th scope="row" className="px-3 py-2.5 text-left font-semibold">{f}</th>
                <td className="px-3 py-2.5"><Cell v={a} /></td>
                <td className="bg-grape-soft px-3 py-2.5"><Cell v={b} strong /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Suspense fallback={<SkeletonList rows={4} />}>
        <Plans />
      </Suspense>
      </div>

      <ButtonLink href="/dashboard" variant="ghost" block>Not now, keep practising free</ButtonLink>
    </div>
  );
}

async function Plans() {
  const user = await requireUser();
  const premium = isPremium(user.subscription);
  const plans = await planViews();
  return (
    <div className="space-y-6">
      {premium && user.subscription ? (
        <Card tone="ok" className="flex items-start gap-3 text-sm">
          <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-ok-ink" strokeWidth={3} />
          <p>
            You have Premium until <strong>{user.subscription.currentPeriodEnd.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</strong>.
            {user.subscription.mode === "FIXED_PERIOD" ? " Paying again adds more time on top." : ""}
          </p>
        </Card>
      ) : null}

      <Card as="section" id="ask-parent" className="scroll-mt-20 space-y-3" tone="paper">
        <h2 className="text-xl font-extrabold">Ask a parent to pay</h2>
        <p className="text-sm">Send a secure link on WhatsApp. They can pay by bank transfer, USSD or card, and your Premium unlocks straight away.</p>
        <AskParent firstName={user.name.split(" ")[0]} />
      </Card>

      <Card as="section">
        <h2 className="mb-4 text-xl font-extrabold">Or pay now</h2>
        <PlanPicker plans={plans} action={checkout} defaultEmail={user.email} />
      </Card>
    </div>
  );
}
