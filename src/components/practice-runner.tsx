"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { answerQuestion, flagQuestion, startPractice, videoOpened } from "@/app/actions/practice";
import type { VideoAccess } from "@/lib/practice";
import { StartButton } from "./start-practice-button";
import { StreakFlame } from "./ui";

export type Answered = {
  selectedIndex: number;
  isCorrect: boolean;
  correctIndex: number;
  explanationHtml: string;
  pointsAwarded: number;
  video: VideoAccess;
};

export type RunnerQuestion = {
  id: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stemHtml: string;
  optionsHtml: string[];
  hasVideo: boolean;
  answered: Answered | null;
};

const LETTERS = ["A", "B", "C", "D", "E"];
const now = () => Date.now();
const DIFF = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" } as const;

export function PracticeRunner(props: {
  sessionId: string;
  topicId: string;
  subjectSlug: string;
  title: string;
  subject: string;
  questions: RunnerQuestion[];
  initialStreak: number;
  remaining: number | null;
}) {
  const { questions } = props;
  const [answers, setAnswers] = useState<Record<string, Answered>>(() =>
    Object.fromEntries(questions.filter((q) => q.answered).map((q) => [q.id, q.answered!])),
  );
  const firstOpen = questions.findIndex((q) => !q.answered);
  const [index, setIndex] = useState(firstOpen === -1 ? questions.length : firstOpen);
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [streak, setStreak] = useState(props.initialStreak);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(props.remaining);
  const [isPending, startTransition] = useTransition();
  const shownAt = useRef<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const q = questions[index];
  const result = q ? answers[q.id] : undefined;

  useEffect(() => {
    shownAt.current = now();
    headingRef.current?.focus();
  }, [index]);

  function choose(i: number) {
    if (!q || result || isPending) return;
    setPendingChoice(i);
    setError(null);
    const timeMs = now() - shownAt.current;
    startTransition(async () => {
      try {
        const res = await answerQuestion({ sessionId: props.sessionId, questionId: q.id, selectedIndex: i, timeMs });
        if (res.status === "limit") {
          setLimitHit(true);
        } else if (res.status === "error") {
          setError(res.message);
        } else {
          setAnswers((a) => ({ ...a, [q.id]: { selectedIndex: i, ...res } }));
          setStreak(res.streak);
          if (res.limit !== null) setRemaining(Math.max(0, res.limit - res.answeredToday));
          if (res.milestone) setCelebrate(`🔥 ${res.milestone}-day streak! Bonus points earned.`);
        }
      } catch {
        setError("Network problem. Check your connection and tap the option again.");
      } finally {
        setPendingChoice(null);
      }
    });
  }

  const done = index >= questions.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const points = Object.values(answers).reduce((n, a) => n + a.pointsAwarded, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/subjects/${props.subjectSlug}`} className="text-sm text-brand">← {props.subject}</Link>
          <p className="truncate font-semibold">{props.title}</p>
        </div>
        <StreakFlame days={streak} />
      </div>

      <div
        className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Practice set progress"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={answeredCount}
      >
        <div className="h-full bg-brand transition-all" style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }} />
      </div>

      {celebrate ? (
        <p role="status" className="mb-3 rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold">{celebrate}</p>
      ) : null}

      {limitHit ? (
        <Paywall />
      ) : done ? (
        <Summary {...{ correctCount, answeredCount, points, total: questions.length, topicId: props.topicId, subjectSlug: props.subjectSlug }} />
      ) : q ? (
        <article className="card" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-sm">
            <h2 ref={headingRef} tabIndex={-1} className="font-semibold outline-none">
              Question {index + 1} of {questions.length}
            </h2>
            <span className="chip bg-surface-2 text-muted">{DIFF[q.difficulty]}</span>
          </div>
          <div className="prose-q mb-4 text-[1.05rem]" dangerouslySetInnerHTML={{ __html: q.stemHtml }} />

          <ul className="space-y-2" role="list">
            {q.optionsHtml.map((html, i) => {
              const state = !result
                ? pendingChoice === i
                  ? "pending"
                  : "idle"
                : i === result.correctIndex
                  ? "correct"
                  : i === result.selectedIndex
                    ? "wrong"
                    : "dim";
              const cls = {
                idle: "border-border bg-surface hover:border-brand",
                pending: "border-brand bg-brand-soft",
                correct: "border-ok bg-ok-soft",
                wrong: "border-bad bg-bad-soft",
                dim: "border-border bg-surface opacity-70",
              }[state];
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    disabled={!!result || isPending}
                    aria-pressed={result ? i === result.selectedIndex : undefined}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition-colors ${cls}`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        state === "correct" ? "bg-ok text-white" : state === "wrong" ? "bg-bad text-white" : "bg-surface-2"
                      }`}
                    >
                      {state === "correct" ? "✓" : state === "wrong" ? "✗" : LETTERS[i]}
                    </span>
                    <span className="prose-q min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: html }} />
                    {state === "pending" ? <span className="muted text-xs">Checking…</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {error ? <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p> : null}

          {result ? (
            <ResultPanel
              key={q.id}
              questionId={q.id}
              result={result}
              onNext={() => setIndex((n) => n + 1)}
              isLast={index === questions.length - 1}
            />
          ) : remaining !== null && remaining <= 3 ? (
            <p className="muted mt-3 text-center text-xs">
              {remaining} free question{remaining === 1 ? "" : "s"} left today · <Link href="/premium" className="font-semibold text-brand">Go unlimited</Link>
            </p>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

function ResultPanel({ questionId, result, onNext, isLast }: { questionId: string; result: Answered; onNext: () => void; isLast: boolean }) {
  return (
    <section className="mt-4 space-y-3" aria-label="Answer and explanation">
      <p role="status" className={`rounded-xl px-4 py-3 font-semibold ${result.isCorrect ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
        {result.isCorrect ? "Correct! " : `Not quite — the answer is ${LETTERS[result.correctIndex]}. `}
        {result.pointsAwarded > 0 ? <span className="font-normal">+{result.pointsAwarded} points</span> : null}
      </p>
      <div className="rounded-xl bg-surface-2 p-4">
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Step-by-step</h3>
        <div className="prose-q" dangerouslySetInnerHTML={{ __html: result.explanationHtml }} />
      </div>
      <VideoSolution questionId={questionId} video={result.video} afterWrong={!result.isCorrect} />
      <button type="button" onClick={onNext} className="btn-primary w-full">
        {isLast ? "See my score" : "Next question"}
      </button>
      <FlagForm questionId={questionId} />
    </section>
  );
}

function VideoSolution({ questionId, video, afterWrong }: { questionId: string; video: VideoAccess; afterWrong: boolean }) {
  const [open, setOpen] = useState(false);
  if (video.kind === "none") return null;
  if (video.kind === "locked") {
    return (
      <Link href="/premium" className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-accent bg-accent-soft px-4 py-3">
        <span className="text-sm">
          <span className="block font-semibold">🔒 Video solution available</span>
          Watch a teacher solve this with Premium.
        </span>
        <span className="text-sm font-semibold text-brand">Unlock</span>
      </Link>
    );
  }
  if (!open) {
    return (
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => {
          setOpen(true);
          void videoOpened(questionId, afterWrong);
        }}
      >
        ▶ Watch solution <span className="muted text-sm font-normal">(short video, uses data)</span>
      </button>
    );
  }
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <iframe
        className="size-full"
        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
        title="Video solution"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

function FlagForm({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (msg) return <p role="status" className="muted text-center text-sm">{msg}</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="muted mx-auto block text-sm underline">
        Report a problem with this question
      </button>
    );
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
        start(async () => {
          const r = await flagQuestion(questionId, reason);
          setMsg(r.message);
        });
      }}
    >
      <label htmlFor={`flag-${questionId}`} className="label">What looks wrong?</label>
      <textarea id={`flag-${questionId}`} name="reason" className="input min-h-20 py-2" required minLength={3} maxLength={500} placeholder="e.g. I think the answer should be C because…" />
      <button className="btn-secondary w-full" disabled={pending}>{pending ? "Sending…" : "Send report"}</button>
    </form>
  );
}

function Summary(p: { correctCount: number; answeredCount: number; points: number; total: number; topicId: string; subjectSlug: string }) {
  const pct = p.answeredCount ? Math.round((p.correctCount / p.answeredCount) * 100) : 0;
  const msg = pct >= 80 ? "Excellent work! 🎉" : pct >= 50 ? "Good effort — keep going!" : "Keep practising — read each explanation carefully.";
  return (
    <section className="card text-center">
      <h2 className="text-xl font-bold">{msg}</h2>
      <p className="mt-3 text-4xl font-extrabold">
        {p.correctCount}/{p.answeredCount}
      </p>
      <p className="muted">correct · {pct}%</p>
      <p className="mt-2 font-semibold text-brand">+{p.points} points</p>
      <div className="mt-5 grid gap-2">
        <form action={startPractice}>
          <input type="hidden" name="topicId" value={p.topicId} />
          <StartButton label="Practise this topic again" className="btn-primary w-full" />
        </form>
        <Link href={`/subjects/${p.subjectSlug}`} className="btn-secondary">Choose another topic</Link>
        <Link href="/leaderboard" className="btn-ghost">See the leaderboard</Link>
      </div>
    </section>
  );
}

function Paywall() {
  return (
    <section className="card border-accent text-center">
      <p className="text-4xl" aria-hidden>⭐</p>
      <h2 className="mt-2 text-xl font-bold">You&apos;ve used today&apos;s free questions</h2>
      <p className="muted mt-1">Great work! Your streak is safe. Come back tomorrow for more free questions, or go unlimited now.</p>
      <ul className="mx-auto mt-4 max-w-xs space-y-1 text-left text-sm">
        <li>✅ Unlimited practice questions</li>
        <li>✅ Every video solution</li>
        <li>✅ Detailed progress for each topic</li>
        <li>✅ Past questions & mock exams (coming soon)</li>
      </ul>
      <div className="mt-5 grid gap-2">
        <Link href="/premium" className="btn-accent">See Premium plans</Link>
        <Link href="/premium#ask-parent" className="btn-secondary">Ask a parent to pay</Link>
      </div>
    </section>
  );
}
