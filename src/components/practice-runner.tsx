"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, Check, Flag, Lock, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { answerQuestion, flagQuestion, startPractice, videoOpened } from "@/app/actions/practice";
import type { VideoAccess } from "@/lib/practice";
import { Button, ButtonLink } from "./ds/button";
import { Chip, Stamp } from "./ds/badge";
import { ProgressBar } from "./ds/progress";
import { Flame } from "./ds/rewards";
import { MarginNote } from "./ds/doodles";
import { Sheet } from "./ds/sheet";
import { Toast } from "./ds/toast";
import { CountUp } from "./ds/count-up";
import { SubmitButton } from "./ds/submit-button";
import { Textarea } from "./ds/field";
import { haptic } from "./ds/feedback";
import { cn } from "./ds/cn";

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
const DIFF = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" } as const;
const PRAISE = ["Correct!", "Sharp!", "You got it!", "Clean!", "Oya, next one!", "Na you be this!"];
const COMFORT = ["Not quite.", "Close one.", "No wahala."];
const now = () => Date.now();
const pick = (list: string[], seed: number) => list[seed % list.length];

export function PracticeRunner(props: {
  sessionId: string;
  topicId: string;
  subjectSlug: string;
  title: string;
  subject: string;
  questions: RunnerQuestion[];
  initialStreak: number;
  initialPoints: number;
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
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [streak, setStreak] = useState(props.initialStreak);
  const [points, setPoints] = useState(props.initialPoints);
  const [floatPts, setFloatPts] = useState<{ n: number; key: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(props.remaining);
  const [isPending, startTransition] = useTransition();
  const shownAt = useRef<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const q = questions[index];
  const result = q ? answers[q.id] : undefined;

  useEffect(() => {
    shownAt.current = now();
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          setPaywallOpen(true);
        } else if (res.status === "error") {
          setError(res.message);
        } else {
          setAnswers((a) => ({ ...a, [q.id]: { selectedIndex: i, ...res } }));
          setStreak(res.streak);
          if (res.pointsAwarded > 0) {
            setPoints((p) => p + res.pointsAwarded);
            setFloatPts({ n: res.pointsAwarded, key: now() });
          }
          if (res.limit !== null) setRemaining(Math.max(0, res.limit - res.answeredToday));
          if (res.milestone) setToast(`${res.milestone}-day streak! Bonus points dey your account.`);
          haptic(res.isCorrect ? 15 : [8, 50, 8]);
        }
      } catch {
        setError("Network wahala. Check your data and tap the option again.");
      } finally {
        setPendingChoice(null);
      }
    });
  }

  const done = index >= questions.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const setPoints_ = Object.values(answers).reduce((n, a) => n + a.pointsAwarded, 0);

  return (
    <div>
      {/* Top bar: exit, set progress, streak + points */}
      <header className="sticky top-0 z-20 -mx-4 mb-4 border-b-2 border-line bg-subj px-4 pb-3 pt-2 text-on-subj">
        <div className="flex items-center gap-3">
          <Link href={`/subjects/${props.subjectSlug}`} className="btn-ghost min-h-10 shrink-0 px-2 text-inherit hover:bg-black/10" aria-label={`Leave practice and go back to ${props.subject}`}>
            <X className="size-6" />
          </Link>
          <ProgressBar value={answeredCount} max={questions.length} label="Practice set progress" className="flex-1" />
          <span className="flex shrink-0 items-center gap-0.5 rounded-full border-2 border-line bg-sun px-2 py-0.5 text-on-fill" aria-label={`${streak} day streak`}>
            <Flame days={streak} size={18} />
            <span className="num text-base">{streak}</span>
          </span>
          <span className="relative flex shrink-0 items-center rounded-full border-2 border-line bg-sun px-2.5 py-0.5 text-on-fill" aria-label={`${points} points`}>
            <span className="num text-base"><CountUp to={points} from={props.initialPoints} /></span>
            {floatPts ? (
              <span key={floatPts.key} aria-hidden className="anim-float pointer-events-none absolute -top-3 right-0 rounded-full border-2 border-line bg-ok px-1 font-display text-xs font-extrabold text-on-fill">
                +{floatPts.n}
              </span>
            ) : null}
          </span>
        </div>
        <p className="mt-1.5 truncate pl-12 text-xs font-bold">
          {props.subject} · {props.title}
        </p>
      </header>

      {done ? (
        <Summary {...{ correctCount, answeredCount, points: setPoints_, total: questions.length, topicId: props.topicId, subjectSlug: props.subjectSlug, questions, answers }} />
      ) : limitHit ? (
        <LimitReached onOpen={() => setPaywallOpen(true)} />
      ) : q ? (
        <article aria-labelledby="q-heading">
          <div className="sticker overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b-2 border-line bg-subj px-4 py-2 text-on-subj">
              <h1 id="q-heading" ref={headingRef} tabIndex={-1} className="font-display text-sm font-extrabold outline-none">
                Question {index + 1} <span className="font-semibold">of {questions.length}</span>
              </h1>
              <Chip tone="neutral">{DIFF[q.difficulty]}</Chip>
            </div>
            <div className="prose-q px-4 py-5 text-[1.0625rem]" dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
          </div>

          <ul className="mt-4 space-y-3" aria-label="Options">
            {q.optionsHtml.map((html, i) => (
              <li key={i}>
                <Option
                  letter={LETTERS[i]}
                  html={html}
                  state={
                    !result
                      ? pendingChoice === i
                        ? "pending"
                        : "idle"
                      : i === result.correctIndex
                        ? i === result.selectedIndex
                          ? "correct"
                          : "answer"
                        : i === result.selectedIndex
                          ? "wrong"
                          : "dim"
                  }
                  disabled={!!result || isPending}
                  onClick={() => choose(i)}
                />
              </li>
            ))}
          </ul>

          {error ? (
            <p role="alert" className="mt-3 rounded-[var(--r-md)] border-2 border-line bg-oops-soft px-4 py-3 text-sm font-semibold text-oops-ink">{error}</p>
          ) : null}

          {result ? (
            <ResultPanel key={q.id} seed={index} question={q} result={result} onNext={() => setIndex((n) => n + 1)} isLast={index === questions.length - 1} />
          ) : remaining !== null && remaining <= 3 ? (
            <p className="mt-4 text-center text-sm text-ink-2">
              {remaining} free question{remaining === 1 ? "" : "s"} left today ·{" "}
              <Link href="/premium" className="font-bold text-ink underline decoration-sun decoration-[3px] underline-offset-2">Go unlimited</Link>
            </p>
          ) : null}
        </article>
      ) : null}

      <UpgradeSheet open={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <Toast message={toast} onDone={() => setToast(null)} tone="sun" icon={<Flame days={7} size={20} animate={false} />} />
    </div>
  );
}

type OptionState = "idle" | "pending" | "correct" | "answer" | "wrong" | "dim";

function Option({ letter, html, state, disabled, onClick }: { letter: string; html: string; state: OptionState; disabled: boolean; onClick: () => void }) {
  const box = {
    idle: "bg-card shadow-sticker pressable",
    pending: "bg-sun-soft translate-x-[3px] translate-y-[3px] shadow-none",
    correct: "bg-ok text-on-fill shadow-sticker anim-pop",
    answer: "bg-ok-soft border-dashed",
    wrong: "bg-oops text-on-fill anim-shake",
    dim: "bg-card opacity-60",
  }[state];
  const tile = {
    idle: "bg-paper-2",
    pending: "bg-sun text-on-fill",
    correct: "bg-card text-ink",
    answer: "bg-ok text-on-fill",
    wrong: "bg-card text-ink",
    dim: "bg-paper-2",
  }[state];
  const label = { correct: "Correct", answer: "Right answer", wrong: "Your answer" }[state as "correct" | "answer" | "wrong"];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label ? `Option ${letter}, ${label}` : `Option ${letter}`}
      className={cn("flex min-h-14 w-full items-center gap-3 border-2 border-line px-3 py-2.5 text-left [border-radius:var(--r-sticker)] disabled:cursor-default", box)}
    >
      <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-[8px] border-2 border-line font-display text-base font-extrabold", tile)}>
        {state === "correct" || state === "answer" ? <Check className="size-5" strokeWidth={3} /> : state === "wrong" ? <X className="size-5" strokeWidth={3} /> : letter}
      </span>
      <span className="prose-q min-w-0 flex-1 text-[1.0625rem]" dangerouslySetInnerHTML={{ __html: html }} />
      {label ? <span className={cn("shrink-0 font-display text-xs font-extrabold uppercase tracking-wide", state === "answer" ? "text-ok-ink" : "text-on-fill")}>{label}</span> : null}
      {state === "pending" ? <span className="shrink-0 text-xs font-bold text-ink-2">Checking…</span> : null}
    </button>
  );
}

function ResultPanel({ question, result, onNext, isLast, seed }: { question: RunnerQuestion; result: Answered; onNext: () => void; isLast: boolean; seed: number }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  return (
    <section className="mt-5 space-y-4" aria-label="Answer and explanation">
      <div
        role="status"
        className={cn(
          "anim-rise flex items-center gap-3 border-2 border-line px-4 py-3 [border-radius:var(--r-sticker)]",
          result.isCorrect ? "bg-ok text-on-fill shadow-sticker" : "bg-oops text-on-fill shadow-sticker",
        )}
      >
        <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-full border-2 border-line", result.isCorrect ? "bg-card" : "bg-card")}>
          {result.isCorrect ? <Check className="size-5 text-ok-ink" strokeWidth={3} /> : <Sparkles className="size-5 text-oops-ink" />}
        </span>
        <p className="font-display text-lg font-extrabold leading-tight">
          {result.isCorrect ? pick(PRAISE, seed) : `${pick(COMFORT, seed)} The answer is ${LETTERS[result.correctIndex]}.`}
          {result.pointsAwarded > 0 ? <span className="ml-2 font-sans text-sm font-bold">+{result.pointsAwarded} pts</span> : null}
          {!result.isCorrect ? <span className="block font-sans text-sm font-semibold">Here&apos;s how to get it next time.</span> : null}
        </p>
      </div>

      <div className="ruled overflow-hidden border-2 border-line [border-radius:var(--r-sticker)]">
        <h2 className="border-b-2 border-line bg-card px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wider">Workings</h2>
        <div className="prose-q workings steps-reveal py-3 pl-12 pr-4" dangerouslySetInnerHTML={{ __html: result.explanationHtml }} />
      </div>

      {!result.isCorrect ? <MarginNote>Read each step, then try a similar one. This kind of question comes back, and you&apos;ll be ready.</MarginNote> : null}

      {result.video.kind !== "none" ? (
        <Button
          variant="secondary"
          block
          icon={result.video.kind === "locked" ? <Lock className="size-5" /> : <Play className="size-5" />}
          onClick={() => (result.video.kind === "locked" ? setUpgradeOpen(true) : setVideoOpen(true))}
        >
          Watch the solution{result.video.kind === "locked" ? " · Premium" : ""}
        </Button>
      ) : null}

      <Button block size="lg" onClick={onNext} iconRight={<ArrowRight className="size-5" />}>
        {isLast ? "See my score" : "Next question"}
      </Button>

      <FlagForm questionId={question.id} />

      {result.video.kind === "open" ? (
        <VideoSheet open={videoOpen} onClose={() => setVideoOpen(false)} youtubeId={result.video.youtubeId} questionId={question.id} stemHtml={question.stemHtml} afterWrong={!result.isCorrect} />
      ) : null}
      <UpgradeSheet open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="video" />
    </section>
  );
}

function VideoSheet({ open, onClose, youtubeId, questionId, stemHtml, afterWrong }: { open: boolean; onClose: () => void; youtubeId: string; questionId: string; stemHtml: string; afterWrong: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <Sheet open={open} onClose={() => { setPlaying(false); onClose(); }} title="Video solution">
      <details className="mb-3 rounded-[var(--r-md)] border-2 border-line bg-paper-2 px-3 py-2">
        <summary className="cursor-pointer font-display text-sm font-bold">See the question</summary>
        <div className="prose-q mt-2 text-sm" dangerouslySetInnerHTML={{ __html: stemHtml }} />
      </details>
      <div className="relative aspect-video overflow-hidden rounded-[var(--r-md)] border-2 border-line bg-band">
        {playing ? (
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Video solution"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : open ? (
          <button
            type="button"
            className="group absolute inset-0 grid place-items-center"
            onClick={() => {
              setPlaying(true);
              void videoOpened(questionId, afterWrong);
            }}
            aria-label="Play video solution"
          >
            {/* Small poster (~10 KB) only loads once the sheet is open */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-80" />
            <span className="relative grid size-16 place-items-center rounded-full border-2 border-line bg-sun text-on-fill shadow-sticker transition-transform group-active:translate-x-[3px] group-active:translate-y-[3px] group-active:shadow-none">
              <Play className="size-7 translate-x-0.5" fill="currentColor" />
            </span>
          </button>
        ) : null}
      </div>
      <p className="muted mt-2 text-xs">Short video · uses mobile data. Tap play when you&apos;re ready.</p>
    </Sheet>
  );
}

function UpgradeSheet({ open, onClose, reason = "limit" }: { open: boolean; onClose: () => void; reason?: "limit" | "video" }) {
  return (
    <Sheet open={open} onClose={onClose} tone="grape" title={reason === "video" ? "Watch a teacher solve it" : "That's today's free questions"}>
      <p className="mb-4">
        {reason === "video"
          ? "Video solutions come with Premium. Your written workings are always free."
          : "You've done the work today, and your streak is safe. Come back tomorrow for more free questions, or keep going now with Premium."}
      </p>
      <ul className="mb-5 space-y-2">
        {["Unlimited practice questions", "Every video solution", "Detailed progress for each topic", "Past questions & mock exams (coming soon)"].map((t) => (
          <li key={t} className="flex items-center gap-2 font-semibold">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-line bg-sun text-on-fill"><Check className="size-3.5" strokeWidth={3} /></span>
            {t}
          </li>
        ))}
      </ul>
      <div className="grid gap-2">
        <ButtonLink href="/premium" variant="sun" block size="lg">See Premium plans</ButtonLink>
        <ButtonLink href="/premium#ask-parent" variant="secondary" block>Ask a parent to pay</ButtonLink>
        <Button variant="ghost" block onClick={onClose}>Not now</Button>
      </div>
    </Sheet>
  );
}

function LimitReached({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="sticker anim-rise bg-grape p-6 text-center text-on-grape">
      <Stamp tone="sun" animate>Day done</Stamp>
      <h1 className="mt-4 text-2xl font-extrabold">You&apos;ve used today&apos;s free questions</h1>
      <p className="mt-2 font-semibold">Your streak is safe. Free questions reset at midnight.</p>
      <div className="mt-5 grid gap-2">
        <Button variant="sun" block onClick={onOpen}>What Premium unlocks</Button>
        <ButtonLink href="/premium#ask-parent" variant="secondary" block>Ask a parent to pay</ButtonLink>
        <ButtonLink href="/dashboard" variant="ghost" block>Back home</ButtonLink>
      </div>
    </section>
  );
}

function FlagForm({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (msg) return <p role="status" className="muted text-center text-sm">{msg}</p>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mx-auto flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink-2 underline underline-offset-2">
        <Flag className="size-4" /> Something wrong with this question?
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Report this question">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
            start(async () => {
              const r = await flagQuestion(questionId, reason);
              setMsg(r.message);
              setOpen(false);
            });
          }}
        >
          <label htmlFor={`flag-${questionId}`} className="label">What looks wrong?</label>
          <Textarea id={`flag-${questionId}`} name="reason" required minLength={3} maxLength={500} placeholder="e.g. I think the answer should be C because…" />
          <Button type="submit" block loading={pending}>Send to a teacher</Button>
        </form>
      </Sheet>
    </>
  );
}

function Summary(p: {
  correctCount: number;
  answeredCount: number;
  points: number;
  total: number;
  topicId: string;
  subjectSlug: string;
  questions: RunnerQuestion[];
  answers: Record<string, Answered>;
}) {
  const pct = p.answeredCount ? Math.round((p.correctCount / p.answeredCount) * 100) : 0;
  const verdict = pct >= 80 ? { stamp: "Sharp!", tone: "ok" as const, line: "You dey try! This topic is getting strong." } : pct >= 50 ? { stamp: "Solid", tone: "info" as const, line: "Good effort. One more round and it'll stick." } : { stamp: "Keep going", tone: "oops" as const, line: "Every wrong answer here is one less in the exam hall." };
  const missed = p.questions.filter((q) => p.answers[q.id] && !p.answers[q.id].isCorrect);
  useEffect(() => {
    if (pct >= 80) haptic([15, 60, 15]);
  }, [pct]);
  return (
    <section className="space-y-5" aria-labelledby="score-heading">
      <div className="sticker anim-rise relative overflow-hidden bg-subj px-5 py-7 text-center text-on-subj">
        <h1 id="score-heading" className="sr-only">Your score</h1>
        <p className="font-display text-sm font-bold uppercase tracking-widest">Your score</p>
        <p className="mt-1 flex items-baseline justify-center gap-1">
          <span className="num text-7xl"><CountUp to={p.correctCount} duration={900} /></span>
          <span className="num text-3xl">/{p.answeredCount}</span>
        </p>
        <div className="mt-3"><Stamp tone={verdict.tone} animate>{verdict.stamp}</Stamp></div>
        <p className="mt-4 font-semibold">{verdict.line}</p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-line bg-sun px-3 py-1 font-display font-extrabold text-on-fill">+{p.points} points</p>
      </div>

      <div className="grid gap-2">
        <form action={startPractice}>
          <input type="hidden" name="topicId" value={p.topicId} />
          <SubmitButton block size="lg" icon={<RotateCcw className="size-5" />} pendingLabel="Loading…">
            {missed.length ? "Practise this topic again" : "Another round"}
          </SubmitButton>
        </form>
        <ButtonLink href={`/subjects/${p.subjectSlug}`} variant="secondary" block>Pick the next topic</ButtonLink>
        <ButtonLink href="/leaderboard" variant="ghost" block>See where you rank</ButtonLink>
      </div>

      {missed.length ? (
        <section aria-labelledby="review-heading">
          <h2 id="review-heading" className="mb-2 text-lg font-extrabold">Review what you missed</h2>
          <ul className="space-y-3">
            {missed.map((q) => {
              const a = p.answers[q.id];
              return (
                <li key={q.id}>
                  <details className="group border-2 border-line bg-card [border-radius:var(--r-sticker)]">
                    <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[6px] border-2 border-line bg-oops-soft font-display text-sm font-extrabold">{p.questions.indexOf(q) + 1}</span>
                      <span className="prose-q line-clamp-2 flex-1 text-sm" dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
                      <span className="text-xs font-bold text-ink-2 group-open:hidden">Show</span>
                    </summary>
                    <div className="border-t-2 border-line px-4 py-3 text-sm">
                      <p className="mb-2 font-semibold">
                        You picked {LETTERS[a.selectedIndex]} · answer is <span className="text-ok-ink">{LETTERS[a.correctIndex]}</span>
                      </p>
                      <div className="prose-q workings pl-10" dangerouslySetInnerHTML={{ __html: a.explanationHtml }} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
