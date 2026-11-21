"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { login, signup } from "@/app/actions/auth";
import { Button } from "./ds/button";
import { Field, FormError, Input } from "./ds/field";

export function SignupForm({ source }: { source?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="sticker space-y-4 p-5 text-ink">
      <input type="hidden" name="source" value={source ?? ""} />
      <FormError message={state?.error} />
      <Field id="name" label="What should we call you?">
        <Input id="name" name="name" autoComplete="name" required defaultValue={state?.fields?.name} placeholder="e.g. Tobi Adebayo" />
      </Field>
      <Field id="identifier" label="Phone number or email" hint="Your phone number works. No email needed.">
        <Input id="identifier" name="identifier" autoComplete="username" inputMode="email" required defaultValue={state?.fields?.identifier} placeholder="0801 234 5678" aria-describedby="identifier-hint" />
      </Field>
      <Field id="password" label="Create a password" hint="At least 6 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required aria-describedby="password-hint" />
      </Field>
      <Button type="submit" block size="lg" loading={pending} iconRight={<ArrowRight className="size-5" />}>
        {pending ? "Creating your account…" : "Create free account"}
      </Button>
      <p className="text-center text-sm text-ink-2">
        Already have an account? <Link className="font-bold text-ink underline decoration-primary decoration-[3px] underline-offset-2" href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="sticker space-y-4 p-5 text-ink">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError message={state?.error} />
      <Field id="identifier" label="Phone number or email">
        <Input id="identifier" name="identifier" autoComplete="username" inputMode="email" required defaultValue={state?.fields?.identifier} />
      </Field>
      <Field id="password" label="Password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" block size="lg" loading={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-ink-2">
        New here? <Link className="font-bold text-ink underline decoration-primary decoration-[3px] underline-offset-2" href="/signup">Create a free account</Link>
      </p>
    </form>
  );
}
