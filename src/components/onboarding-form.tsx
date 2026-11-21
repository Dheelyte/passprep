"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/auth";
import { FormError } from "./ui";

const CLASSES = [
  { v: "JSS3", l: "JSS 3" },
  { v: "SS1", l: "SS 1" },
  { v: "SS2", l: "SS 2" },
  { v: "SS3", l: "SS 3" },
];
const EXAMS = ["WAEC", "NECO", "JAMB"];

const pill =
  "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-3 text-center font-semibold " +
  "has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]";

export function OnboardingForm({
  firstName,
  subjects,
  defaults,
}: {
  firstName: string;
  subjects: { id: string; name: string }[];
  defaults: { classLevel?: string; exams: string[]; subjects: string[] };
}) {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  return (
    <form action={action} className="space-y-6">
      <p className="text-lg">Hi {firstName} 👋</p>
      <FormError message={state?.error} />
      <fieldset>
        <legend className="label">Your class</legend>
        <div className="grid grid-cols-4 gap-2">
          {CLASSES.map((c) => (
            <label key={c.v} className={pill}>
              <input className="sr-only" type="radio" name="classLevel" value={c.v} defaultChecked={defaults.classLevel === c.v} required />
              {c.l}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Exams you&apos;re preparing for</legend>
        <div className="grid grid-cols-3 gap-2">
          {EXAMS.map((e) => (
            <label key={e} className={pill}>
              <input className="sr-only" type="checkbox" name="exams" value={e} defaultChecked={defaults.exams.includes(e)} />
              {e}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Subjects</legend>
        <div className="grid grid-cols-2 gap-2">
          {subjects.map((s) => (
            <label key={s.id} className={pill}>
              <input className="sr-only" type="checkbox" name="subjects" value={s.id} defaultChecked={defaults.subjects.includes(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Start practising"}</button>
    </form>
  );
}
