import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";
import { SkeletonList } from "@/components/ds";

export const metadata: Metadata = { title: "Set up your study plan" };

export default function OnboardingPage() {
  return (
    <Suspense fallback={<SkeletonList rows={5} />}>
      <Onboarding />
    </Suspense>
  );
}

async function Onboarding() {
  const user = await requireUser({ allowUnonboarded: true });
  const [subjects, chosen] = await Promise.all([
    db.subject.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
    db.userSubject.findMany({ where: { userId: user.id }, select: { subjectId: true } }),
  ]);
  return (
    <OnboardingForm
      firstName={user.name.split(" ")[0]}
      subjects={subjects}
      defaults={{ classLevel: user.classLevel ?? undefined, exams: user.exams, subjects: chosen.map((c) => c.subjectId) }}
    />
  );
}
