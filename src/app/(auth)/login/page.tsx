import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { googleEnabled } from "@/lib/google";

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled. Try again, or use your phone number or email.",
  google_state: "That Google sign-in expired. Please try again.",
  google_email: "Your Google account has no verified email address, so we can't use it to sign in.",
  google_conflict: "This email is already linked to a different Google account.",
  google_failed: "We couldn't sign you in with Google. Please try again.",
  google_off: "Google sign-in isn't available right now. Use your phone number or email.",
};

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="text-4xl font-extrabold">Welcome back</h1>
      <p className="mb-6 mt-2 font-semibold">Your streak is waiting.</p>
      <Suspense fallback={<LoginForm google={googleEnabled()} />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={typeof next === "string" ? next : undefined}
      google={googleEnabled()}
      notice={typeof error === "string" ? GOOGLE_ERRORS[error] : undefined}
    />
  );
}
