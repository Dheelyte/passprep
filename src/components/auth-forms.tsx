"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";
import { FormError } from "./ui";

export function SignupForm({ source }: { source?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="source" value={source ?? ""} />
      <FormError message={state?.error} />
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input className="input" id="name" name="name" autoComplete="name" required defaultValue={state?.fields?.name} placeholder="e.g. Tobi Adebayo" />
      </div>
      <div>
        <label className="label" htmlFor="identifier">Phone number or email</label>
        <input className="input" id="identifier" name="identifier" autoComplete="username" inputMode="email" required defaultValue={state?.fields?.identifier} placeholder="0801 234 5678" />
      </div>
      <div>
        <label className="label" htmlFor="password">Create a password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
        <p className="muted mt-1 text-xs">At least 6 characters.</p>
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Creating account…" : "Create free account"}</button>
      <p className="muted text-center text-sm">
        Already have an account? <Link className="font-semibold text-brand" href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError message={state?.error} />
      <div>
        <label className="label" htmlFor="identifier">Phone number or email</label>
        <input className="input" id="identifier" name="identifier" autoComplete="username" inputMode="email" required defaultValue={state?.fields?.identifier} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Logging in…" : "Log in"}</button>
      <p className="muted text-center text-sm">
        New here? <Link className="font-semibold text-brand" href="/signup">Create a free account</Link>
      </p>
    </form>
  );
}
