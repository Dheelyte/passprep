import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return (
    <>
      <PageHeader title="Subjects" subtitle="Pick a subject, then work through it topic by topic." />
      <Suspense fallback={<SkeletonList />}>
        <Subjects />
      </Suspense>
    </>
  );
}

async function Subjects() {
  const user = await requireUser();
  const [subjects, mine] = await Promise.all([
    db.subject.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { topics: { where: { parentId: null }, select: { id: true } } },
    }),
    db.userSubject.findMany({ where: { userId: user.id }, select: { subjectId: true } }),
  ]);
  const mineSet = new Set(mine.map((m) => m.subjectId));
  const sorted = [...subjects].sort((a, b) => Number(mineSet.has(b.id)) - Number(mineSet.has(a.id)));
  return (
    <ul className="space-y-3">
      {sorted.map((s) => (
        <li key={s.id}>
          <Link href={`/subjects/${s.slug}`} className="card flex items-center justify-between hover:border-brand">
            <span>
              <span className="block font-semibold">{s.name}</span>
              <span className="muted text-sm">{s.topics.length} topics</span>
            </span>
            {mineSet.has(s.id) ? <span className="chip bg-brand-soft text-brand">My subject</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
