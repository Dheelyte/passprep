import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { subjectScope } from "@/lib/subjects";
import { CardLink, Chip, ScreenHeader, SkeletonList } from "@/components/ds";
import { SubjectIcon } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return (
    <>
      <ScreenHeader tone="primary" title="Pick a subject" subtitle="Then work through it one topic at a time, the way the syllabus runs." />
      <Suspense fallback={<SkeletonList rows={4} />}>
        <Subjects />
      </Suspense>
    </>
  );
}

async function Subjects() {
  const user = await requireUser();
  const [subjects, mine, counts] = await Promise.all([
    db.subject.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, include: { topics: { where: { parentId: null }, select: { id: true } } } }),
    db.userSubject.findMany({ where: { userId: user.id }, select: { subjectId: true } }),
    db.question.groupBy({ by: ["topicId"], where: { status: "PUBLISHED" }, _count: true }),
  ]);
  const topicSubject = new Map((await db.topic.findMany({ select: { id: true, subjectId: true } })).map((t) => [t.id, t.subjectId]));
  const qCount = new Map<string, number>();
  for (const c of counts) {
    const s = topicSubject.get(c.topicId);
    if (s) qCount.set(s, (qCount.get(s) ?? 0) + c._count);
  }
  const mineSet = new Set(mine.map((m) => m.subjectId));
  const sorted = [...subjects].sort((a, b) => Number(mineSet.has(b.id)) - Number(mineSet.has(a.id)));
  return (
    <ul className="space-y-3">
      {sorted.map((s) => {
        const n = qCount.get(s.id) ?? 0;
        return (
          <li key={s.id} data-subject={subjectScope(s.slug)}>
            <CardLink href={`/subjects/${s.slug}`} tone="subject" className="flex items-center gap-4 py-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-line bg-card text-ink">
                <SubjectIcon slug={s.slug} className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl font-extrabold">{s.name}</span>
                <span className="text-sm font-bold">{s.topics.length} topics · {n ? `${n} questions` : "questions coming soon"}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {mineSet.has(s.id) ? <Chip tone="sun">Yours</Chip> : null}
                <ArrowRight aria-hidden className="size-6" />
              </span>
            </CardLink>
          </li>
        );
      })}
    </ul>
  );
}
