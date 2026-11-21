import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { unpublishQuestion } from "@/app/actions/admin";
import { QuestionEditor } from "@/components/question-editor";
import { QuestionPreview } from "@/components/question-preview";
import { SkeletonList } from "@/components/admin-ui";

export default function EditQuestionPage({ params }: PageProps<"/admin/questions/[id]">) {
  return (
    <Suspense fallback={<SkeletonList rows={6} />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: { params: PageProps<"/admin/questions/[id]">["params"] }) {
  const user = await requireRole("TEACHER", "ADMIN");
  const { id } = await params;
  const q = await db.question.findUnique({
    where: { id },
    include: {
      topic: { select: { subjectId: true } },
      author: { select: { name: true } },
      reviewer: { select: { name: true } },
      flags: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { attempts: true } },
    },
  });
  if (!q) notFound();
  const [topics, wrong] = await Promise.all([
    db.topic.findMany({ where: { subjectId: q.topic.subjectId }, orderBy: [{ order: "asc" }], include: { parent: { select: { name: true } } } }),
    db.attempt.count({ where: { questionId: id, isCorrect: false } }),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/admin/questions" className="text-sm text-info">← Question bank</Link>
      <p className="muted text-sm">
        Status <strong className="text-ink">{q.status.replace("_", " ").toLowerCase()}</strong> · written by {q.author?.name ?? "—"} · reviewed by {q.reviewer?.name ?? "—"} ·{" "}
        answered {q._count.attempts}× ({q._count.attempts ? Math.round((wrong / q._count.attempts) * 100) : 0}% wrong)
      </p>
      {q.reviewNote ? <p className="card bg-sun-soft text-sm"><strong>Review note:</strong> {q.reviewNote}</p> : null}
      {user.role !== "ADMIN" && q.status === "PUBLISHED" ? (
        <p className="card text-sm">Saving changes to a published question sends it back for review by another teacher.</p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuestionEditor
          q={{ id: q.id, topicId: q.topicId, stem: q.stem, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, difficulty: q.difficulty, videoUrl: q.videoUrl ?? "", videoFree: q.videoFree }}
          topics={topics.map((t) => ({ id: t.id, label: t.parent ? `${t.parent.name} › ${t.name}` : t.name }))}
        />
        <section className="card">
          <h2 className="mb-2 font-semibold">Current version (as students see it)</h2>
          <QuestionPreview q={q} />
        </section>
      </div>
      {q.flags.length ? (
        <section className="card">
          <h2 className="mb-2 font-semibold">Student reports</h2>
          <ul className="space-y-1 text-sm">
            {q.flags.map((f) => <li key={f.id}><span className="muted">{f.createdAt.toLocaleDateString("en-NG")} · {f.status.toLowerCase()}:</span> {f.reason}</li>)}
          </ul>
        </section>
      ) : null}
      {user.role === "ADMIN" && q.status === "PUBLISHED" ? (
        <form action={unpublishQuestion}>
          <input type="hidden" name="id" value={q.id} />
          <button className="btn-secondary text-danger">Unpublish (hide from students)</button>
        </form>
      ) : null}
    </div>
  );
}
