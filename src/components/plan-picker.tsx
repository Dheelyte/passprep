"use client";

import { useActionState, useState } from "react";
import type { CheckoutState } from "@/app/actions/billing";
import { FormError } from "./ui";

export type PlanView = {
  code: "MONTHLY" | "TERMLY" | "YEARLY" | "EXAM_PASS";
  name: string;
  amountKobo: number;
  periodDays: number;
  autoRenewAvailable: boolean;
};

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;
const blurb: Record<PlanView["code"], string> = {
  MONTHLY: "Try it for a month",
  TERMLY: "Covers a full school term",
  YEARLY: "Best value for the whole session",
  EXAM_PASS: "For WAEC / JAMB candidates · 3 months",
};

export function PlanPicker({
  plans,
  action,
  defaultEmail,
  token,
  submitLabel = "Continue to payment",
}: {
  plans: PlanView[];
  action: (s: CheckoutState, f: FormData) => Promise<CheckoutState>;
  defaultEmail?: string | null;
  token?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [plan, setPlan] = useState<PlanView["code"]>("TERMLY");
  const [mode, setMode] = useState<"FIXED_PERIOD" | "AUTO_RENEW">("FIXED_PERIOD");
  const selected = plans.find((p) => p.code === plan) ?? plans[0];
  const canAuto = !!selected?.autoRenewAvailable;
  const effectiveMode = canAuto ? mode : "FIXED_PERIOD";

  return (
    <form action={formAction} className="space-y-5">
      {token ? <input type="hidden" name="token" value={token} /> : null}
      <FormError message={state?.error} />
      <fieldset>
        <legend className="label">1. Choose a plan</legend>
        <div className="space-y-2">
          {plans.map((p) => (
            <label
              key={p.code}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 py-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
            >
              <input type="radio" name="plan" value={p.code} checked={plan === p.code} onChange={() => setPlan(p.code)} className="size-5 accent-[var(--brand)]" />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {p.name}
                  {p.code === "TERMLY" ? <span className="chip bg-accent text-[#2b1d00]">Popular with parents</span> : null}
                </span>
                <span className="muted block text-sm">{blurb[p.code]}</span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-bold">{naira(p.amountKobo)}</span>
                <span className="muted text-xs">{p.periodDays} days</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">2. How will you pay?</legend>
        <input type="hidden" name="mode" value={effectiveMode} />
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setMode("FIXED_PERIOD")}
            aria-pressed={effectiveMode === "FIXED_PERIOD"}
            className={`rounded-xl border-2 px-4 py-3 text-left ${effectiveMode === "FIXED_PERIOD" ? "border-brand bg-brand-soft" : "border-border bg-surface"}`}
          >
            <span className="block font-semibold">Bank transfer, USSD or card — pay once</span>
            <span className="muted text-sm">Access for {selected?.periodDays} days. We&apos;ll remind you before it ends. Nothing renews automatically.</span>
          </button>
          {canAuto ? (
            <button
              type="button"
              onClick={() => setMode("AUTO_RENEW")}
              aria-pressed={effectiveMode === "AUTO_RENEW"}
              className={`rounded-xl border-2 px-4 py-3 text-left ${effectiveMode === "AUTO_RENEW" ? "border-brand bg-brand-soft" : "border-border bg-surface"}`}
            >
              <span className="block font-semibold">Card — renew automatically</span>
              <span className="muted text-sm">Never lose access. Cancel anytime from the account page.</span>
            </button>
          ) : null}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="email">3. Email for the receipt</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" defaultValue={defaultEmail ?? ""} placeholder="parent@example.com" />
        <p className="muted mt-1 text-xs">Paystack sends the receipt here. It can be a parent&apos;s email.</p>
      </div>

      <button className="btn-accent w-full text-lg" disabled={pending}>
        {pending ? "Opening secure payment…" : `${submitLabel} · ${selected ? naira(selected.amountKobo) : ""}`}
      </button>
      <p className="muted text-center text-xs">Secure payment by Paystack. Access unlocks as soon as payment is confirmed.</p>
    </form>
  );
}
