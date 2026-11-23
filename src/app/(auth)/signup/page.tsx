import type { Metadata } from "next";
import { ogBase } from "@/lib/site";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth-forms";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Sign up free in two minutes. Practise WAEC, NECO and JAMB questions topic by topic, with every answer explained step by step. No card needed.",
  alternates: { canonical: "/signup" },
  openGraph: { ...ogBase({ withImage: true }), url: "/signup", title: "Create your free account" },
};

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <>
      <h1 className="text-4xl font-extrabold">Let&apos;s get you exam-ready</h1>
      <p className="mb-6 mt-2 font-semibold">Two minutes to sign up. Free to start. No card needed.</p>
      <Suspense fallback={<SignupForm google={googleEnabled()} />}>
        <SignupWithSource searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SignupWithSource({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const sp = await searchParams;
  const source = [sp.utm_source, sp.ref].flat().find((v): v is string => typeof v === "string");
  return <SignupForm source={source} google={googleEnabled()} />;
}
