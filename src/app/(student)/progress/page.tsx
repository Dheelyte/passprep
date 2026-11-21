import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { mySubjects } from "@/lib/student";
import { subjectProgress } from "@/lib/progress";
import { MasteryChip, PageHeader, SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Your progress" subtitle="Strong and weak topics, based on your most recent answers." />
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Progress />
      </Suspense>
    </>
  );
}

async function Progress() {
  const user = await requireUser();
  const subjects = await mySubjects(user.id);
  const all = await Promise.all(subjects.map(async (s) => ({ s, topics: await subjectProgress(user.id, s.id) })));
  return (
    <div className="space-y-4">
      {all.map(({ s, topics }) => {
        const tried = topics.filter((t) => t.attempts > 0);
        const weak = topics.filter((t) => t.mastery === "weak");
        const strong = topics.filter((t) => t.mastery === "strong");
        return (
          <section key={s.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <Link href={`/progress/${s.slug}`} className="text-sm font-semibold text-brand">Details</Link>
            </div>
            {tried.length === 0 ? (
              <p className="muted text-sm">
                No practice yet. <Link href={`/subjects/${s.slug}`} className="font-semibold text-brand">Start a topic</Link>
              </p>
            ) : (
              <>
                <p className="muted mb-3 text-sm">
                  {strong.length} strong · {weak.length} need work · {topics.length - tried.length} not started
                </p>
                <ul className="space-y-2">
                  {tried.map((t) => (
                    <li key={t.topicId} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                      <MasteryChip mastery={t.mastery} />
                      <span className="w-10 text-right text-sm font-semibold">{Math.round((t.accuracy ?? 0) * 100)}%</span>
                    </li>
                  ))}
                </ul>
                {weak.length ? (
                  <p className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm">
                    Focus next on <strong>{weak[0].name}</strong>. <Link className="font-semibold text-brand" href={`/subjects/${s.slug}`}>Practise it</Link>
                  </p>
                ) : null}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
