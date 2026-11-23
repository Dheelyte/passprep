import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { reviewQuestion } from "@/app/actions/admin";
import { QuestionPreview } from "@/components/question-preview";
import { FormError, PageHeader, SkeletonList } from "@/components/admin-ui";

export default function ReviewPage({ searchParams }: PageProps<"/admin/review">) {
  return (
    <>
      <PageHeader title="Review queue" subtitle="Check the answer is right and the explanation is clear and complete. You can't approve your own questions." />
      <Suspense fallback={<SkeletonList rows={3} />}>
        <Queue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Queue({ searchParams }: { searchParams: PageProps<"/admin/review">["searchParams"] }) {
  const user = await requireRole("TEACHER", "ADMIN");
  const { error } = await searchParams;
  const where = { status: "IN_REVIEW" as const, ...(user.role === "ADMIN" ? {} : { NOT: { authorId: user.id } }) };
  const [items, total, mine] = await Promise.all([
    db.question.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { topic: { include: { subject: true, parent: true } }, author: { select: { name: true } } },
    }),
    db.question.count({ where }),
    db.question.count({ where: { status: "IN_REVIEW", authorId: user.id } }),
  ]);

  return (
    <div className="space-y-4">
      <FormError message={error === "own" ? "You can't approve a question you wrote. Another teacher must review it." : error === "note" ? "Add a note explaining why you're rejecting the question." : null} />
      <p className="muted text-sm">
        {total} waiting{mine && user.role !== "ADMIN" ? ` · ${mine} of your own questions are waiting for another teacher` : ""}
      </p>
      {items.length === 0 ? <p className="card muted">Nothing to review. 🎉</p> : null}
      {items.map((q) => (
        <article key={q.id} id={`q-${q.id}`} className="card grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <p className="muted mb-2 text-xs">
              {q.topic.subject.name} › {q.topic.parent ? `${q.topic.parent.name} › ` : ""}{q.topic.name} · {q.difficulty.toLowerCase()} · by {q.author?.name ?? "unknown"}
              {q.authorId === user.id ? " (you)" : ""}
            </p>
            <QuestionPreview q={q} />
          </div>
          <form action={reviewQuestion} className="space-y-2">
            <input type="hidden" name="id" value={q.id} />
            <label className="label" htmlFor={`note-${q.id}`}>Note to author (required to reject)</label>
            <textarea id={`note-${q.id}`} name="note" className="input min-h-24 py-2" placeholder="e.g. Step 2 skips how we got 3^4." />
            <div className="grid grid-cols-2 gap-2">
              <button name="decision" value="reject" className="btn-secondary">Reject</button>
              <button name="decision" value="approve" className="btn-primary">Approve</button>
            </div>
            <Link href={`/admin/questions/${q.id}`} className="btn-ghost w-full text-sm">Edit first</Link>
          </form>
        </article>
      ))}
    </div>
  );
}
