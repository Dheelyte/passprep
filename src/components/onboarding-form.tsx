"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { completeOnboarding } from "@/app/actions/auth";
import { Button } from "./ds/button";
import { FormError } from "./ds/field";
import { ProgressBar } from "./ds/progress";
import { SubjectIcon } from "./subject-icon";
import { cn } from "./ds/cn";

const CLASSES = [
  { v: "JSS3", l: "JSS 3", d: "Getting a head start" },
  { v: "SS1", l: "SS 1", d: "Building the basics" },
  { v: "SS2", l: "SS 2", d: "WAEC is coming" },
  { v: "SS3", l: "SS 3", d: "Exam year — let's go" },
];
const EXAMS = [
  { v: "WAEC", d: "West African Senior School Certificate" },
  { v: "NECO", d: "National Examinations Council" },
  { v: "JAMB", d: "UTME for university admission" },
];

// Big tappable choice: a real radio/checkbox under a sticker label (works with keyboard + screen readers).
const choice =
  "pressable flex min-h-16 cursor-pointer items-center gap-3 border-2 border-line bg-card px-4 py-3 shadow-sticker [border-radius:var(--r-sticker)] " +
  "has-[:checked]:bg-lime has-[:checked]:text-on-fill has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]";
const tick = "ml-auto grid size-7 shrink-0 place-items-center rounded-full border-2 border-line bg-card text-transparent peer-checked:text-on-fill";

export function OnboardingForm({
  firstName,
  subjects,
  defaults,
}: {
  firstName: string;
  subjects: { id: string; name: string; slug: string }[];
  defaults: { classLevel?: string; exams: string[]; subjects: string[] };
}) {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const [step, setStep] = useState(0);
  const [classLevel, setClassLevel] = useState(defaults.classLevel ?? "");
  const [exams, setExams] = useState<string[]>(defaults.exams);
  const [chosen, setChosen] = useState<string[]>(defaults.subjects);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const canNext = [classLevel !== "", exams.length > 0, chosen.length > 0][step];
  const titles = [`Hi ${firstName}! What class are you in?`, "Which exams are you writing?", "Pick your subjects"];
  const hints = ["We'll show the topics for your class first.", "Pick all that apply.", "You can change these any time."];

  return (
    <form action={action} className="space-y-6">
      <div>
        <p className="mb-2 flex justify-between text-sm font-bold text-ink-2">
          <span>Step {step + 1} of 3</span>
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 underline underline-offset-2">
              <ArrowLeft aria-hidden className="size-4" /> Back
            </button>
          ) : null}
        </p>
        <ProgressBar value={step + 1} max={3} label={`Step ${step + 1} of 3`} />
      </div>

      <div key={step} className="anim-rise">
        <h1 className="text-3xl font-extrabold">{titles[step]}</h1>
        <p className="muted mt-1">{hints[step]}</p>
      </div>
      <FormError message={state?.error} />

      {/* All steps stay mounted so every value is submitted; only the current one is visible. */}
      <fieldset hidden={step !== 0} className="space-y-3">
        <legend className="sr-only">Your class</legend>
        {CLASSES.map((c) => (
          <label key={c.v} className={choice}>
            <input className="peer sr-only" type="radio" name="classLevel" value={c.v} checked={classLevel === c.v} onChange={() => setClassLevel(c.v)} />
            <span className="num w-16 text-2xl">{c.l}</span>
            <span className="text-sm font-semibold">{c.d}</span>
            <span aria-hidden className={tick}><Check className="size-4" strokeWidth={3} /></span>
          </label>
        ))}
      </fieldset>

      <fieldset hidden={step !== 1} className="space-y-3">
        <legend className="sr-only">Exams</legend>
        {EXAMS.map((e) => (
          <label key={e.v} className={choice}>
            <input className="peer sr-only" type="checkbox" name="exams" value={e.v} checked={exams.includes(e.v)} onChange={() => setExams(toggle(exams, e.v))} />
            <span className="num w-20 text-2xl">{e.v}</span>
            <span className="text-sm font-semibold">{e.d}</span>
            <span aria-hidden className={tick}><Check className="size-4" strokeWidth={3} /></span>
          </label>
        ))}
      </fieldset>

      <fieldset hidden={step !== 2} className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Subjects</legend>
        {subjects.map((s) => (
          <label key={s.id} data-subject={s.slug} className={cn(choice, "min-h-24 flex-col items-start has-[:checked]:bg-subj")}>
            <input className="peer sr-only" type="checkbox" name="subjects" value={s.id} checked={chosen.includes(s.id)} onChange={() => setChosen(toggle(chosen, s.id))} />
            <span className="flex w-full items-center justify-between">
              <SubjectIcon slug={s.slug} className="size-6" />
              <span aria-hidden className={cn(tick, "ml-0")}><Check className="size-4" strokeWidth={3} /></span>
            </span>
            <span className="font-display text-lg font-extrabold leading-tight">{s.name}</span>
          </label>
        ))}
      </fieldset>

      {step < 2 ? (
        <Button type="button" block size="lg" disabled={!canNext} onClick={() => setStep(step + 1)} iconRight={<ArrowRight className="size-5" />}>
          Next
        </Button>
      ) : (
        <Button type="submit" block size="lg" disabled={!canNext} loading={pending}>
          {pending ? "Setting up…" : "I'm ready"}
        </Button>
      )}
    </form>
  );
}
