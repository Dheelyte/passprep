import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight, Hourglass, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { PublicShell } from "@/components/public-shell";
import { ButtonLink, Card, EmptyState, SkeletonList, Stamp } from "@/components/ds";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

export default function ResultPage({ searchParams }: PageProps<"/payment/result">) {
  return (
    <PublicShell>
      <Suspense fallback={<SkeletonList rows={2} />}>
        <Result searchParams={searchParams} />
      </Suspense>
    </PublicShell>
  );
}

async function Result({ searchParams }: { searchParams: PageProps<"/payment/result">["searchParams"] }) {
  const { ref } = await searchParams;
  const payment = typeof ref === "string" ? await db.payment.findUnique({ where: { reference: ref }, include: { user: { include: { subscription: true } } } }) : null;
  if (!payment) {
    return <EmptyState kind="lost" title="We couldn't find that payment" body="If you were charged, contact support with your Paystack receipt and we'll sort it out." />;
  }
  const viaLink = !!payment.payLinkId;
  const first = payment.user.name.split(" ")[0];
  if (payment.status === "SUCCESS") {
    const end = payment.user.subscription?.currentPeriodEnd;
    return (
      <Card tone="sun" className="anim-rise space-y-4 px-5 py-8 text-center" aria-live="polite">
        <Stamp tone="primary" animate className="text-lg">Paid</Stamp>
        <h1 className="text-3xl font-extrabold">Premium is unlocked!</h1>
        <p>
          {viaLink ? `Thank you! ${first} now has` : "You now have"} unlimited practice and every video solution
          {end ? ` until ${end.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
        </p>
        {viaLink ? (
          <p className="text-sm font-semibold">You can close this page. Your receipt is on its way to your email.</p>
        ) : (
          <ButtonLink href="/subjects" block size="lg" iconRight={<ArrowRight className="size-5" />}>Start practising</ButtonLink>
        )}
      </Card>
    );
  }
  if (payment.status === "PENDING") {
    return (
      <Card tone="info" className="space-y-4 px-5 py-8 text-center" aria-live="polite">
        <Hourglass aria-hidden className="mx-auto size-10" />
        <h1 className="text-2xl font-extrabold">Waiting for your bank…</h1>
        <p>Bank transfers can take a few minutes. Premium unlocks by itself once Paystack confirms — please don&apos;t pay twice.</p>
        <ButtonLink href={`/payment/result?ref=${encodeURIComponent(payment.reference)}`} variant="secondary" block icon={<RotateCcw className="size-5" />}>Check again</ButtonLink>
      </Card>
    );
  }
  return (
    <Card tone="coral" className="space-y-4 px-5 py-8 text-center">
      <h1 className="text-2xl font-extrabold">Payment didn&apos;t go through</h1>
      <p>No money was taken. You can try again whenever you&apos;re ready.</p>
      <ButtonLink href={viaLink ? "/" : "/premium"} block>Try again</ButtonLink>
    </Card>
  );
}
