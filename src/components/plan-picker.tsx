"use client";

import { useActionState, useState } from "react";
import { CalendarCheck, Check, CreditCard, Landmark, Lock, RotateCcw, Smartphone } from "lucide-react";
import type { CheckoutState } from "@/app/actions/billing";
import { Button } from "./ds/button";
import { Field, FormError, Input } from "./ds/field";
import { cn } from "./ds/cn";

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
  YEARLY: "Best value for the session",
  EXAM_PASS: "For WAEC & JAMB candidates",
};

const radioCard =
  "pressable flex cursor-pointer items-center gap-3 border-2 border-line bg-card px-4 py-3 shadow-sticker-sm [border-radius:var(--r-sticker)] " +
  "has-[:checked]:bg-sun has-[:checked]:text-on-fill has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]";

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
    <form action={formAction} className="space-y-6">
      {token ? <input type="hidden" name="token" value={token} /> : null}
      <FormError message={state?.error} />

      <fieldset>
        <legend className="mb-2 font-display text-lg font-extrabold">1. Pick a plan</legend>
        <div className="space-y-2.5">
          {plans.map((p) => (
            <label key={p.code} className={cn(radioCard, "min-h-16 px-3 sm:px-4")}>
              <input type="radio" name="plan" value={p.code} checked={plan === p.code} onChange={() => setPlan(p.code)} className="peer sr-only" />
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-line bg-white text-transparent peer-checked:text-on-fill">
                <Check className="size-3.5" strokeWidth={3.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-extrabold leading-tight">{p.name}</span>
                <span className="block text-sm">{blurb[p.code]} · {p.periodDays} days</span>
                {p.code === "TERMLY" ? <span className="mt-1 inline-block rounded-full border-2 border-line bg-sun px-2 text-xs font-extrabold text-on-fill">Popular with parents</span> : null}
              </span>
              <span className="num shrink-0 text-xl sm:text-2xl">{naira(p.amountKobo)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <input type="hidden" name="mode" value={effectiveMode} />
      {/* The payment method (transfer, USSD or card) is chosen on Paystack's page. The only thing to decide
          here is renewal, and only when a Paystack plan exists: Paystack subscriptions are card-only. */}
      {canAuto ? (
        <fieldset>
          <legend className="mb-2 font-display text-lg font-extrabold">2. Renew automatically?</legend>
          <div className="grid gap-2.5">
            <label className={radioCard}>
              <input type="radio" name="_mode" checked={effectiveMode === "FIXED_PERIOD"} onChange={() => setMode("FIXED_PERIOD")} className="peer sr-only" />
              <CalendarCheck aria-hidden className="size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block font-bold">No, pay once</span>
                <span className="block text-sm">Access for {selected?.periodDays} days. We remind you before it ends.</span>
              </span>
            </label>
            <label className={radioCard}>
              <input type="radio" name="_mode" checked={effectiveMode === "AUTO_RENEW"} onChange={() => setMode("AUTO_RENEW")} className="peer sr-only" />
              <RotateCcw aria-hidden className="size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block font-bold">Yes, renew with my card</span>
                <span className="block text-sm">Never lose access. Cancel any time from your profile. Card only.</span>
              </span>
            </label>
          </div>
        </fieldset>
      ) : null}

      <Field id="email" label={<span className="font-display text-lg font-extrabold">{canAuto ? 3 : 2}. Email for the receipt</span>} hint="Paystack sends the receipt here. A parent's email is fine.">
        <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaultEmail ?? ""} placeholder="parent@example.com" aria-describedby="email-hint" />
      </Field>

      <Button type="submit" variant="sun" block size="lg" loading={pending} icon={<Lock className="size-5" />}>
        {pending ? "Opening secure payment…" : `${submitLabel} · ${selected ? naira(selected.amountKobo) : ""}`}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold">
        <span className="flex gap-1" aria-hidden><Landmark className="size-4" /><Smartphone className="size-4" /><CreditCard className="size-4" /></span>
        {effectiveMode === "AUTO_RENEW" ? "Pay by card on Paystack's secure page." : "Choose bank transfer, USSD or card on Paystack's secure page."}
      </p>
      <p className="muted text-center text-xs">Premium unlocks as soon as payment is confirmed.</p>
    </form>
  );
}
