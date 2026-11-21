import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { subjectDetail, subjectProgress } from "@/lib/progress";
import { renderInline } from "@/lib/markdown";
import { MasteryChip, SkeletonList } from "@/components/ui";

export default function SubjectProgressPage({ params }: PageProps<"/progress/[slug]">) {
  return (
    <Suspense fallback={<SkeletonList rows={6} />}>
      <Detail params={params} />
    </Suspense>
  );
}

const pct = (n: number | null) => (n === null ? "–" : `${Math.round(n * 100)}%`);

async function Detail({ params }: { params: PageProps<"/progress/[slug]">["params"] }) {
  const { slug } = await params;
  const user = await requireUser();
  const subject = await db.subject.findUnique({ where: { slug } });
  if (!subject) notFound();
  const topics = await subjectProgress(user.id, subject.id);
  const premium = isPremium(user.subscription);
  const detail = premium ? await subjectDetail(user.id, subject.id) : null;

  return (
    <div className="space-y-4">
      <nav className="text-sm"><Link href="/progress" className="text-brand">← Progress</Link></nav>
      <h1 className="text-2xl font-bold">{subject.name}</h1>

      <section className="card">
        <h2 className="mb-2 font-semibold">Topics</h2>
        <ul className="divide-y divide-border">
          {topics.map((t) => (
            <li key={t.topicId} className="flex min-h-12 items-center gap-3 py-2">
              <span className="min-w-0 flex-1 text-sm">{t.name}</span>
              <MasteryChip mastery={t.mastery} />
              <span className="w-10 text-right text-sm font-semibold">{pct(t.accuracy)}</span>
            </li>
          ))}
        </ul>
        <p className="muted mt-2 text-xs">Based on your last 20 answers per topic. You need at least 5 answers before a topic is rated.</p>
      </section>

      {detail ? (
        <>
          <section className="card">
            <h2 className="mb-3 font-semibold">Accuracy by week</h2>
            {detail.trend.length === 0 ? (
              <p className="muted text-sm">Not enough data yet.</p>
            ) : (
              <div className="flex h-32 items-end gap-2" role="img" aria-label="Weekly accuracy chart">
                {detail.trend.map((w) => (
                  <div key={w.week.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold">{pct(w.accuracy)}</span>
                    <div className="w-full rounded-t-md bg-brand" style={{ height: `${Math.max(4, w.accuracy * 90)}px` }} />
                    <span className="muted text-[10px]">{w.week.toISOString().slice(5, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card">
            <h2 className="mb-2 font-semibold">By difficulty</h2>
            <ul className="grid grid-cols-3 gap-2 text-center">
              {["EASY", "MEDIUM", "HARD"].map((d) => {
                const row = detail.byDifficulty.find((r) => r.difficulty === d);
                return (
                  <li key={d} className="rounded-xl bg-surface-2 p-3">
                    <span className="muted block text-xs">{d.toLowerCase()}</span>
                    <span className="text-lg font-bold">{row ? pct(row.accuracy) : "–"}</span>
                    <span className="muted block text-xs">{row?.total ?? 0} answered</span>
                  </li>
                );
              })}
            </ul>
          </section>
          {detail.missed.length ? (
            <section className="card">
              <h2 className="mb-2 font-semibold">Questions you miss most</h2>
              <ul className="space-y-2 text-sm">
                {detail.missed.map((m) => (
                  <li key={m.questionId} className="rounded-xl bg-surface-2 p-3">
                    <span className="muted block text-xs">{m.topic} · missed {m.wrong}×</span>
                    <span className="prose-q line-clamp-3" dangerouslySetInnerHTML={{ __html: renderInline(m.stem) }} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <Link href="/premium" className="card block border-dashed border-accent bg-accent-soft">
          <span className="font-semibold">🔒 Detailed progress</span>
          <span className="block text-sm">See your weekly trend, accuracy by difficulty and the questions you miss most — with Premium.</span>
        </Link>
      )}
    </div>
  );
}
