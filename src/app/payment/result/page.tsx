import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { Logo } from "@/components/logo";
import { SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

export default function ResultPage({ searchParams }: PageProps<"/payment/result">) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="mb-6"><Logo /></div>
      <Suspense fallback={<SkeletonList rows={2} />}>
        <Result searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Result({ searchParams }: { searchParams: PageProps<"/payment/result">["searchParams"] }) {
  const { ref } = await searchParams;
  const payment = typeof ref === "string" ? await db.payment.findUnique({ where: { reference: ref }, include: { user: { include: { subscription: true } } } }) : null;
  if (!payment) {
    return <p className="card">We couldn&apos;t find that payment. If you were charged, contact support with your Paystack receipt.</p>;
  }
  const viaLink = !!payment.payLinkId;
  if (payment.status === "SUCCESS") {
    const end = payment.user.subscription?.currentPeriodEnd;
    return (
      <div className="card space-y-3 text-center">
        <p className="text-5xl" aria-hidden>🎉</p>
        <h1 className="text-2xl font-bold">Premium is unlocked!</h1>
        <p className="muted">
          {viaLink ? `Thank you! ${payment.user.name.split(" ")[0]} now has` : "You now have"} unlimited practice and every video solution
          {end ? ` until ${end.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
        </p>
        {viaLink ? (
          <p className="text-sm">You can close this page. A receipt has been sent to your email.</p>
        ) : (
          <Link href="/subjects" className="btn-primary w-full">Start practising</Link>
        )}
      </div>
    );
  }
  if (payment.status === "PENDING") {
    return (
      <div className="card space-y-3">
        <h1 className="text-xl font-bold">Waiting for your bank…</h1>
        <p className="muted">Bank transfers can take a few minutes to confirm. Premium unlocks automatically once Paystack confirms it — you don&apos;t need to pay again.</p>
        <Link href={`/payment/result?ref=${encodeURIComponent(payment.reference)}`} className="btn-secondary w-full">Check again</Link>
      </div>
    );
  }
  return (
    <div className="card space-y-3">
      <h1 className="text-xl font-bold">Payment not completed</h1>
      <p className="muted">No money was taken. You can try again.</p>
      <Link href={viaLink ? "/" : "/premium"} className="btn-primary w-full">Try again</Link>
    </div>
  );
}
