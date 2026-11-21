import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";
import { SkeletonList } from "@/components/ds";

export const metadata: Metadata = { title: "Set up your study plan" };

const STEPS: Record<string, number> = { class: 0, exams: 1, subjects: 2 };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Suspense fallback={<SkeletonList rows={5} />}>
      <Onboarding searchParams={searchParams} />
    </Suspense>
  );
}

async function Onboarding({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const user = await requireUser({ allowUnonboarded: true });
  const { step } = await searchParams;
  // Deep links (e.g. "Edit subjects") jump straight to a step, but only once the earlier answers exist.
  const startStep = user.onboarded && typeof step === "string" ? (STEPS[step] ?? 0) : 0;
  const [subjects, chosen] = await Promise.all([
    db.subject.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
    db.userSubject.findMany({ where: { userId: user.id }, select: { subjectId: true } }),
  ]);
  return (
    <OnboardingForm
      firstName={user.name.split(" ")[0]}
      subjects={subjects}
      defaults={{ classLevel: user.classLevel ?? undefined, exams: user.exams, subjects: chosen.map((c) => c.subjectId) }}
      editing={user.onboarded}
      startStep={startStep}
    />
  );
}
