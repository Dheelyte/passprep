import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";
import { SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Set up your study plan" };

export default function OnboardingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Set up your study plan</h1>
      <p className="muted mb-6 mt-1">We&apos;ll show you the right topics for your class and exams.</p>
      <Suspense fallback={<SkeletonList rows={5} />}>
        <Onboarding />
      </Suspense>
    </>
  );
}

async function Onboarding() {
  const user = await requireUser({ allowUnonboarded: true });
  const subjects = await db.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, _count: { select: { topics: true } } },
  });
  const chosen = await db.userSubject.findMany({ where: { userId: user.id }, select: { subjectId: true } });
  return (
    <OnboardingForm
      firstName={user.name.split(" ")[0]}
      subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      defaults={{ classLevel: user.classLevel ?? undefined, exams: user.exams, subjects: chosen.map((c) => c.subjectId) }}
    />
  );
}
