import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { subjectProgress, type Mastery } from "@/lib/progress";
import { startPractice } from "@/app/actions/practice";
import { CLASS_LABEL, subjectScope } from "@/lib/subjects";
import { Chip, SkeletonPath, cn } from "@/components/ds";
import { SubmitButton } from "@/components/ds/submit-button";
import { SubjectIcon } from "@/components/subject-icon";

export default function SubjectPage({ params }: PageProps<"/subjects/[slug]">) {
  return (
    <Suspense fallback={<SkeletonPath />}>
      <Subject params={params} />
    </Suspense>
  );
}

const OFFSETS = [0, 28, 56, 28]; // zig-zag x positions (px), keeps cards ≥ 200px wide at 360px
const NODE = 56;

type NodeState = "mastered" | "progress" | "new" | "locked";
function nodeState(n: number, mastery: Mastery | undefined, attempts: number): NodeState {
  if (n === 0) return "locked";
  if (mastery === "strong") return "mastered";
  if (attempts > 0) return "progress";
  return "new";
}
const STATE_LABEL: Record<NodeState, string> = { mastered: "Mastered", progress: "In progress", new: "Not started", locked: "Coming soon" };

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
  const mastered = progress.filter((p) => p.mastery === "strong").length;
  const started = progress.filter((p) => p.attempts > 0).length;

  return (
    <div data-screen={subjectScope(subject.slug)} data-subject={subjectScope(subject.slug)}>
      {/* The whole screen takes the subject's identity: coloured header, tinted page */}
      <header className="bleed -mt-5 md:-mt-8 mb-6 border-b-2 border-line bg-subj pb-5 pt-3 text-on-subj">
        <Link href="/subjects" className="mb-2 inline-flex min-h-10 items-center gap-1 text-sm font-bold">
          <ArrowLeft aria-hidden className="size-4" /> All subjects
        </Link>
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-full border-2 border-line bg-card text-ink shadow-sticker-sm">
            <SubjectIcon slug={subject.slug} className="size-7" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">{subject.name}</h1>
            <p className="text-sm font-bold">WAEC · NECO · JAMB syllabus order</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-ink">
          <div className="rounded-[10px] border-2 border-line bg-card py-2"><dt className="text-xs font-bold text-ink-2">Topics</dt><dd className="num text-2xl">{roots.length}</dd></div>
          <div className="rounded-[10px] border-2 border-line bg-card py-2"><dt className="text-xs font-bold text-ink-2">Started</dt><dd className="num text-2xl">{started}</dd></div>
          <div className="rounded-[10px] border-2 border-line bg-sun py-2 text-on-fill"><dt className="text-xs font-bold">Mastered</dt><dd className="num text-2xl">{mastered}</dd></div>
        </dl>
      </header>

      <ol className="relative max-w-3xl" aria-label={`${subject.name} topics in order`}>
        {roots.map((t, i) => {
          const subs = childrenOf(t.id);
          const n = total(t.id);
          const p = mastery.get(t.id);
          const state = nodeState(n, p?.mastery, p?.attempts ?? 0);
          const x = OFFSETS[i % OFFSETS.length];
          const prevX = OFFSETS[(i - 1 + OFFSETS.length) % OFFSETS.length];
          const forClass = user.classLevel && t.classLevels.includes(user.classLevel);
          return (
            <li key={t.id} className="relative pb-6">
              {i > 0 ? (
                <svg aria-hidden className="absolute -top-6 left-0 h-7 w-40 overflow-visible" viewBox="0 0 160 28">
                  <path d={`M ${prevX + NODE / 2} 0 C ${prevX + NODE / 2} 16, ${x + NODE / 2} 12, ${x + NODE / 2} 28`} fill="none" stroke="var(--subj-ink)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
                </svg>
              ) : null}
              <div className="flex items-start gap-3" style={{ paddingLeft: x }}>
                <PathNode state={state} index={i + 1} accuracy={p?.accuracy ?? null} />
                <div className={cn("min-w-0 flex-1 border-2 border-line bg-card px-3 py-2.5 [border-radius:var(--r-sticker)]", state !== "locked" && "shadow-sticker-sm")}>
                  <h2 className="font-display font-extrabold leading-tight">{t.name}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <Chip tone={state === "mastered" ? "subject-fill" : state === "progress" ? "subject" : "neutral"} icon={state === "mastered" ? <Check aria-hidden className="size-3" strokeWidth={3} /> : state === "locked" ? <Lock aria-hidden className="size-3" /> : undefined}>
                      {STATE_LABEL[state]}
                    </Chip>
                    {forClass ? <Chip tone="sun">Your class</Chip> : t.classLevels.length ? <span className="text-ink-2">{t.classLevels.map((c) => CLASS_LABEL[c]).join(", ")}</span> : null}
                  </p>
                  {n > 0 ? (
                    <form action={startPractice} className="mt-2.5">
                      <input type="hidden" name="topicId" value={t.id} />
                      <SubmitButton size="sm" variant={state === "mastered" ? "secondary" : "primary"} pendingLabel="Loading…">
                        {state === "mastered" ? "Revise" : state === "progress" ? "Keep going" : subs.length ? "Start topic" : "Start"}
                      </SubmitButton>
                    </form>
                  ) : null}
                  {subs.length ? (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label={`${t.name} subtopics`}>
                      {subs.map((s) => {
                        const sn = count.get(s.id) ?? 0;
                        return (
                          <li key={s.id}>
                            {sn > 0 ? (
                              <form action={startPractice}>
                                <input type="hidden" name="topicId" value={s.id} />
                                <button className="pressable inline-flex min-h-10 items-center rounded-full border-2 border-line bg-subj px-3 text-sm font-bold text-on-subj shadow-sticker-sm" aria-label={`Practise ${s.name}`}>
                                  {s.name}
                                </button>
                              </form>
                            ) : (
                              <span className="inline-flex min-h-10 items-center gap-1 rounded-full border-2 border-dashed border-ink-2/60 px-3 text-sm text-ink-2">
                                <Lock aria-hidden className="size-3.5" /> {s.name}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PathNode({ state, index, accuracy }: { state: NodeState; index: number; accuracy: number | null }) {
  const label = `Topic ${index}: ${STATE_LABEL[state]}${state === "progress" && accuracy !== null ? `, ${Math.round(accuracy * 100)}% recent accuracy` : ""}`;
  if (state === "progress") {
    // half-filled node: bottom half in the subject colour
    return (
      <span role="img" aria-label={label} className="relative grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-line bg-card shadow-sticker-sm" style={{ width: NODE, height: NODE }}>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 border-t-2 border-line bg-subj" />
        <span aria-hidden className="relative -mt-5 font-display text-base font-extrabold">{index}</span>
      </span>
    );
  }
  const cls = {
    mastered: "border-line bg-subj text-on-subj shadow-sticker-sm",
    new: "border-subj bg-card text-subj-ink border-[3px] [box-shadow:0_0_0_2px_var(--line)]",
    locked: "border-dashed border-ink-2 bg-paper-2 text-ink-2",
  }[state];
  return (
    <span role="img" aria-label={label} className={cn("grid shrink-0 place-items-center rounded-full border-2 font-display text-lg font-extrabold", cls)} style={{ width: NODE, height: NODE }}>
      {state === "mastered" ? <Check aria-hidden className="size-6" strokeWidth={3} /> : state === "locked" ? <Lock aria-hidden className="size-5" /> : <span aria-hidden>{index}</span>}
    </span>
  );
}
