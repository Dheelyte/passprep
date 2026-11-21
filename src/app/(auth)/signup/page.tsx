import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create your free account" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Start practising for free</h1>
      <p className="muted mb-6 mt-1">Takes less than two minutes. No payment needed.</p>
      <Suspense fallback={<SignupForm />}>
        <SignupWithSource searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SignupWithSource({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const sp = await searchParams;
  const source = [sp.utm_source, sp.ref].flat().find((v): v is string => typeof v === "string");
  return <SignupForm source={source} />;
}
