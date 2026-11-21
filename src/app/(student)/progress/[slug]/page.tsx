import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";
import { subjectDetail, subjectProgress } from "@/lib/progress";
import { renderInline } from "@/lib/markdown";
import { subjectScope } from "@/lib/subjects";
import { Card, CardLink, ProgressRing, SkeletonList } from "@/components/ds";
import { AccuracyBar, MasteryChip } from "@/components/mastery";

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
    <div className="space-y-5" data-screen={subjectScope(subject.slug)} data-subject={subjectScope(subject.slug)}>
      <header className="bleed -mt-5 lg:-mt-8 border-b-2 border-line bg-subj pb-5 pt-3 text-on-subj">
        <Link href="/progress" className="inline-flex min-h-10 items-center gap-1 text-sm font-bold"><ArrowLeft aria-hidden className="size-4" /> Progress</Link>
        <h1 className="text-3xl font-extrabold">{subject.name}</h1>
      </header>

      <Card as="section" aria-labelledby="topics-h">
        <h2 id="topics-h" className="mb-3 text-lg font-extrabold">Every topic</h2>
        <ul className="space-y-3">
          {topics.map((t) => (
            <li key={t.topicId}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold">{t.name}</span>
                <MasteryChip mastery={t.mastery} />
              </div>
              <AccuracyBar accuracy={t.accuracy} label={t.name} />
            </li>
          ))}
        </ul>
        <p className="muted mt-3 text-xs">Based on your last 20 answers per topic. A topic gets rated after 5 answers.</p>
      </Card>

      {detail ? (
        <>
          <Card as="section" aria-labelledby="trend-h">
            <h2 id="trend-h" className="mb-3 text-lg font-extrabold">Accuracy by week</h2>
            {detail.trend.length === 0 ? (
              <p className="muted text-sm">Not enough data yet.</p>
            ) : (
              <div className="graph-paper flex h-40 items-end gap-2 rounded-[10px] border-2 border-line p-3" role="img" aria-label={`Weekly accuracy: ${detail.trend.map((w) => pct(w.accuracy)).join(", ")}`}>
                {detail.trend.map((w) => (
                  <div key={w.week.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                    <span className="num text-xs">{pct(w.accuracy)}</span>
                    <div className="w-full rounded-t-[6px] border-2 border-b-0 border-line bg-subj" style={{ height: `${Math.max(6, w.accuracy * 96)}px` }} />
                    <span className="text-[10px] font-bold text-ink-2">{w.week.toISOString().slice(5, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card as="section" aria-labelledby="diff-h">
            <h2 id="diff-h" className="mb-3 text-lg font-extrabold">By difficulty</h2>
            <ul className="grid grid-cols-3 gap-2 text-center">
              {["EASY", "MEDIUM", "HARD"].map((d) => {
                const row = detail.byDifficulty.find((r) => r.difficulty === d);
                return (
                  <li key={d} className="flex flex-col items-center gap-1">
                    <ProgressRing value={row?.accuracy ?? 0} size={64} label={`${d.toLowerCase()}: ${row ? pct(row.accuracy) : "no data"}`}>
                      <span className="num text-sm">{row ? pct(row.accuracy) : "–"}</span>
                    </ProgressRing>
                    <span className="text-xs font-bold capitalize">{d.toLowerCase()}</span>
                    <span className="muted text-[11px]">{row?.total ?? 0} answered</span>
                  </li>
                );
              })}
            </ul>
          </Card>
          {detail.missed.length ? (
            <Card as="section" aria-labelledby="missed-h">
              <h2 id="missed-h" className="mb-3 text-lg font-extrabold">Questions you miss most</h2>
              <ul className="space-y-2 text-sm">
                {detail.missed.map((m) => (
                  <li key={m.questionId} className="rounded-[10px] border-2 border-line bg-oops-soft p-3 text-ink">
                    <span className="block text-xs font-bold text-oops-ink">{m.topic} · missed {m.wrong}×</span>
                    <span className="prose-q line-clamp-3" dangerouslySetInnerHTML={{ __html: renderInline(m.stem) }} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : (
        <CardLink href="/premium" tone="grape" className="flex items-start gap-3">
          <Lock aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            <span className="block font-display font-extrabold">See the full picture with Premium</span>
            <span className="text-sm">Your weekly trend, accuracy by difficulty and the questions you miss most.</span>
          </span>
        </CardLink>
      )}
    </div>
  );
}
