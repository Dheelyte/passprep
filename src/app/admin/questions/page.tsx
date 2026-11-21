import Link from "next/link";
import { Suspense } from "react";
import type { Prisma, QuestionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, SkeletonList } from "@/components/admin-ui";

const STATUSES: QuestionStatus[] = ["PUBLISHED", "IN_REVIEW", "REJECTED", "DRAFT"];
const tone: Record<QuestionStatus, string> = {
  PUBLISHED: "bg-ok-soft text-ok-ink",
  IN_REVIEW: "bg-sun-soft",
  REJECTED: "bg-danger-soft text-danger",
  DRAFT: "bg-paper-2 text-ink-2",
};

export default function QuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  return (
    <>
      <PageHeader title="Question bank" />
      <Suspense fallback={<SkeletonList rows={8} />}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/questions">["searchParams"] }) {
  await requireRole("TEACHER", "ADMIN");
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const subject = typeof sp.subject === "string" ? sp.subject : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort = sp.sort === "missed" ? "missed" : "recent";
  const where: Prisma.QuestionWhereInput = {
    ...(status ? { status } : {}),
    ...(subject ? { topic: { subject: { slug: subject } } } : {}),
    ...(q ? { stem: { contains: q, mode: "insensitive" } } : {}),
  };
  const [subjects, questions] = await Promise.all([
    db.subject.findMany({ orderBy: { order: "asc" } }),
    db.question.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: sort === "missed" ? 500 : 100,
      include: { topic: { select: { name: true } }, _count: { select: { attempts: true, flags: { where: { status: "OPEN" } } } } },
    }),
  ]);

  // "Most missed" uses attempt stats — the plan's keep-improving loop.
  let stats = new Map<string, { total: number; wrong: number }>();
  if (questions.length) {
    const rows = await db.attempt.groupBy({ by: ["questionId", "isCorrect"], where: { questionId: { in: questions.map((x) => x.id) } }, _count: true });
    stats = new Map();
    for (const r of rows) {
      const s = stats.get(r.questionId) ?? { total: 0, wrong: 0 };
      s.total += r._count;
      if (!r.isCorrect) s.wrong += r._count;
      stats.set(r.questionId, s);
    }
  }
  const list =
    sort === "missed"
      ? [...questions]
          .filter((x) => (stats.get(x.id)?.total ?? 0) >= 5)
          .sort((a, b) => (stats.get(b.id)!.wrong / stats.get(b.id)!.total) - (stats.get(a.id)!.wrong / stats.get(a.id)!.total))
          .slice(0, 100)
      : questions;

  return (
    <>
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search question text" className="input max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="input max-w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
        </select>
        <select name="subject" defaultValue={subject ?? ""} className="input max-w-44">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
        <select name="sort" defaultValue={sort} className="input max-w-52">
          <option value="recent">Recently updated</option>
          <option value="missed">Most often answered wrong</option>
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper-2 text-left">
            <tr><th className="px-3 py-2">Question</th><th>Topic</th><th>Status</th><th>Answered</th><th>% wrong</th><th>Flags</th></tr>
          </thead>
          <tbody>
            {list.map((x) => {
              const s = stats.get(x.id);
              return (
                <tr key={x.id} className="border-t border-rule">
                  <td className="max-w-md px-3 py-2"><Link className="line-clamp-2 text-info hover:underline" href={`/admin/questions/${x.id}`}>{x.stem}</Link></td>
                  <td>{x.topic.name}</td>
                  <td><span className={`chip ${tone[x.status]}`}>{x.status.replace("_", " ").toLowerCase()}</span></td>
                  <td>{x._count.attempts}</td>
                  <td>{s?.total ? `${Math.round((s.wrong / s.total) * 100)}%` : "–"}</td>
                  <td>{x._count.flags || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 ? <p className="muted p-4 text-sm">No questions match.</p> : null}
      </div>
    </>
  );
}
