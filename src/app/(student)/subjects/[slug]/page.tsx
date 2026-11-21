import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { subjectProgress } from "@/lib/progress";
import { startPractice } from "@/app/actions/practice";
import { StartButton } from "@/components/start-practice-button";
import { MasteryChip, SkeletonList } from "@/components/ui";

const CLASS_LABEL: Record<string, string> = { JSS3: "JSS 3", SS1: "SS 1", SS2: "SS 2", SS3: "SS 3" };

export default function SubjectPage({ params }: PageProps<"/subjects/[slug]">) {
  return (
    <Suspense fallback={<SkeletonList rows={6} />}>
      <Subject params={params} />
    </Suspense>
  );
}

async function Subject({ params }: { params: PageProps<"/subjects/[slug]">["params"] }) {
  const { slug } = await params;
  const user = await requireUser();
  const subject = await db.subject.findUnique({ where: { slug } });
  if (!subject || !subject.isActive) notFound();

  const [topics, counts, progress] = await Promise.all([
    db.topic.findMany({ where: { subjectId: subject.id }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    db.question.groupBy({ by: ["topicId"], where: { status: "PUBLISHED", topic: { subjectId: subject.id } }, _count: true }),
    subjectProgress(user.id, subject.id),
  ]);
  const count = new Map(counts.map((c) => [c.topicId, c._count]));
  const mastery = new Map(progress.map((p) => [p.topicId, p]));
  const roots = topics.filter((t) => !t.parentId);
  const childrenOf = (id: string) => topics.filter((t) => t.parentId === id);
  const total = (id: string) => (count.get(id) ?? 0) + childrenOf(id).reduce((n, c) => n + (count.get(c.id) ?? 0), 0);

  return (
    <>
      <nav className="mb-2 text-sm"><Link href="/subjects" className="text-brand">← Subjects</Link></nav>
      <h1 className="mb-1 text-2xl font-bold">{subject.name}</h1>
      <p className="muted mb-4 text-sm">Topics follow the WAEC, NECO and JAMB syllabus, in the order you&apos;ll learn them.</p>

      <ol className="space-y-3">
        {roots.map((t, i) => {
          const subs = childrenOf(t.id);
          const n = total(t.id);
          const p = mastery.get(t.id);
          const forClass = user.classLevel && t.classLevels.includes(user.classLevel);
          return (
            <li key={t.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{i + 1}. {t.name}</h2>
                  <p className="muted mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <span>{n ? `${n} questions` : "Questions coming soon"}</span>
                    {t.classLevels.length ? <span>· {t.classLevels.map((c) => CLASS_LABEL[c]).join(", ")}</span> : null}
                    {forClass ? <span className="chip bg-brand-soft text-brand">Your class</span> : null}
                  </p>
                  {p && p.attempts > 0 ? (
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <MasteryChip mastery={p.mastery} />
                      <span className="muted">{Math.round((p.accuracy ?? 0) * 100)}% of last {p.attempts}</span>
                    </p>
                  ) : null}
                </div>
                {n > 0 ? (
                  <form action={startPractice}>
                    <input type="hidden" name="topicId" value={t.id} />
                    <StartButton label={subs.length ? "Practise all" : "Practise"} />
                  </form>
                ) : null}
              </div>
              {subs.length ? (
                <ul className="mt-3 divide-y divide-border border-t border-border">
                  {subs.map((s) => {
                    const sn = count.get(s.id) ?? 0;
                    return (
                      <li key={s.id} className="flex min-h-12 items-center justify-between gap-3 py-2">
                        <span>
                          <span className="block text-sm font-medium">{s.name}</span>
                          <span className="muted text-xs">{sn ? `${sn} questions` : "Coming soon"}</span>
                        </span>
                        {sn > 0 ? (
                          <form action={startPractice}>
                            <input type="hidden" name="topicId" value={s.id} />
                            <StartButton className="btn-secondary min-h-10 px-4 text-sm" />
                          </form>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}
