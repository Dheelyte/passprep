import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { mySubjects } from "@/lib/student";
import { subjectProgress } from "@/lib/progress";
import { startPractice } from "@/app/actions/practice";
import { subjectScope } from "@/lib/subjects";
import { ButtonLink, Card, EmptyState, ScreenHeader, SkeletonList } from "@/components/ds";
import { SubmitButton } from "@/components/ds/submit-button";
import { AccuracyBar, MasteryChip } from "@/components/mastery";
import { SubjectIcon } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <>
      <ScreenHeader tone="coral" title="Your progress" subtitle="Strong and weak topics, from your most recent answers." />
      <Suspense fallback={<SkeletonList rows={4} />}>
        <Progress />
      </Suspense>
    </>
  );
}

async function Progress() {
  const user = await requireUser();
  const subjects = await mySubjects(user.id);
  const all = await Promise.all(subjects.map(async (s) => ({ s, topics: await subjectProgress(user.id, s.id) })));
  if (all.length === 0) {
    return <EmptyState title="No subjects picked" body="Choose your subjects and your progress shows up here." action={<ButtonLink href="/onboarding">Choose subjects</ButtonLink>} />;
  }
  return (
    <div className="space-y-5">
      {all.map(({ s, topics }) => {
        const tried = topics.filter((t) => t.attempts > 0);
        const weak = topics.filter((t) => t.mastery === "weak").sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
        const strong = topics.filter((t) => t.mastery === "strong");
        const next = weak[0] ?? topics.find((t) => t.attempts === 0);
        return (
          <Card key={s.id} as="section" padded={false} className="overflow-hidden" data-subject={subjectScope(s.slug)} aria-labelledby={`p-${s.id}`}>
            <header className="flex items-center justify-between gap-3 border-b-2 border-line bg-subj px-4 py-3 text-on-subj">
              <h2 id={`p-${s.id}`} className="flex items-center gap-2 text-xl font-extrabold"><SubjectIcon slug={s.slug} /> {s.name}</h2>
              <Link href={`/progress/${s.slug}`} className="flex min-h-10 items-center gap-1 text-sm font-bold underline underline-offset-2">Details <ArrowRight aria-hidden className="size-4" /></Link>
            </header>
            <div className="p-4">
              {tried.length === 0 ? (
                <EmptyState kind="lost" className="border-0 py-4" title="Nothing here yet" body="Finish one practice set and we'll start mapping your strong and weak topics." action={<ButtonLink href={`/subjects/${s.slug}`} size="sm">Start a topic</ButtonLink>} />
              ) : (
                <>
                  <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-[10px] border-2 border-line bg-ok py-2 text-on-fill"><dt className="text-xs font-bold">Strong</dt><dd className="num text-2xl">{strong.length}</dd></div>
                    <div className="rounded-[10px] border-2 border-line bg-oops py-2 text-on-fill"><dt className="text-xs font-bold">Needs work</dt><dd className="num text-2xl">{weak.length}</dd></div>
                    <div className="rounded-[10px] border-2 border-line bg-card py-2"><dt className="text-xs font-bold text-ink-2">Not started</dt><dd className="num text-2xl">{topics.length - tried.length}</dd></div>
                  </dl>
                  <ul className="space-y-3">
                    {tried.map((t) => (
                      <li key={t.topicId}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold">{t.name}</span>
                          <MasteryChip mastery={t.mastery} />
                        </div>
                        <AccuracyBar accuracy={t.accuracy} label={t.name} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {next && tried.length > 0 ? (
                <form action={startPractice} className="mt-4 flex items-center gap-3 rounded-[var(--r-sticker)] border-2 border-dashed border-line bg-subj-soft p-3">
                  <input type="hidden" name="topicId" value={next.topicId} />
                  <Target aria-hidden className="size-6 shrink-0" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-bold">Practise this next</span>
                    <span className="block truncate">{next.name}</span>
                  </span>
                  <SubmitButton size="sm" pendingLabel="…">Go</SubmitButton>
                </form>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
