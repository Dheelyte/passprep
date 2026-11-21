import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create your free account" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <>
      <h1 className="text-4xl font-extrabold">Let&apos;s get you exam-ready</h1>
      <p className="muted mb-6 mt-2">Two minutes to sign up. Free to start. No card needed.</p>
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
