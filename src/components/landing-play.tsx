"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { Avatar, Button, ButtonLink, Flame, TrophyIcon } from "./ds";
import { cn } from "./ds/cn";

// Hands-on bits of the landing page. Everything is local state: no network, no sign-in.

/* ---------------------------------------------------------------- Try a question */

export type PlayQuestion = { subject: string; topic: string; stemHtml: string; optionsHtml: string[]; correct: number; workingsHtml: string };

const RIGHT = ["Sharp!", "Correct!", "You got it!"];
const WRONG = ["Not quite.", "Close one.", "Almost."];

/** A playable 3-question set that marks answers and shows the workings, like the real thing. */
export function TryQuestions({ questions }: { questions: PlayQuestion[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, points: 0 });
  const [done, setDone] = useState(false);
  const after = useRef<HTMLDivElement>(null);
  const q = questions[i];
  const answered = picked !== null;
  const isRight = picked === q.correct;

  // After answering, move focus to the feedback so keyboard and screen-reader users land on the workings.
  useEffect(() => {
    if (answered) after.current?.focus({ preventScroll: true });
  }, [answered]);

  const choose = (n: number) => {
    if (answered) return;
    setPicked(n);
    // Same rule as the app: +10 for a right answer, +2 for trying.
    setScore((s) => ({ right: s.right + (n === q.correct ? 1 : 0), points: s.points + (n === q.correct ? 10 : 2) }));
  };
  const next = () => {
    if (i + 1 >= questions.length) return setDone(true);
    setI(i + 1);
    setPicked(null);
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setScore({ right: 0, points: 0 });
    setDone(false);
  };

  if (done) {
    return (
      <div className="sticker anim-rise p-6 text-center" role="status">
        <p className="font-display text-sm font-extrabold uppercase tracking-wider text-ink-2">Your score</p>
        <p className="num mt-1 text-6xl">{score.right}/{questions.length}</p>
        <p className="mt-2 font-semibold">
          +{score.points} points.{" "}
          {score.right === questions.length ? "Full marks. Imagine what a whole topic does." : "Every miss came with the method, so the next one is yours."}
        </p>
        <div className="mt-5 grid gap-2 sm:flex sm:justify-center">
          <ButtonLink href="/signup" variant="sun" size="lg" iconRight={<ArrowRight className="size-5" />}>Keep going, free</ButtonLink>
          <Button variant="ghost" onClick={restart} icon={<RotateCcw className="size-4" />}>Play again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticker overflow-hidden p-0" data-subject={q.subject}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-subj px-4 py-2 text-sm text-on-subj">
        <span className="font-display font-extrabold">{q.topic} · Q{i + 1} of {questions.length}</span>
        <span className="num rounded-full border-2 border-line bg-card px-2.5 text-ink" aria-label={`${score.points} points`}>
          <span key={score.points} className="anim-bump inline-block">{score.points}</span> pts
        </span>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="prose-q text-lg font-semibold" dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
        <div role="group" aria-label="Options" className="space-y-2">
          {q.optionsHtml.map((html, n) => {
            const state = !answered ? "idle" : n === picked ? (isRight ? "correct" : "wrong") : n === q.correct ? "answer" : "dim";
            return (
              <button
                key={`${i}-${n}`}
                type="button"
                onClick={() => choose(n)}
                disabled={answered}
                aria-label={answered ? undefined : `Option ${"ABCD"[n]}`}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 border-2 border-line px-3 py-2 text-left transition-[transform,box-shadow,background-color,opacity] duration-150 [border-radius:var(--r-sticker)]",
                  state === "idle" && "bg-card shadow-sticker-sm hover:-translate-y-0.5 hover:shadow-sticker active:translate-y-0.5 active:shadow-none",
                  state === "correct" && "anim-pop bg-ok-soft shadow-sticker-sm",
                  state === "wrong" && "anim-shake bg-oops-soft",
                  state === "answer" && "border-dashed bg-ok-soft",
                  state === "dim" && "bg-card opacity-60",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-[6px] border-2 border-line font-display text-sm font-extrabold", state === "correct" || state === "answer" ? "bg-ok text-on-fill" : state === "wrong" ? "bg-oops text-on-fill" : "bg-paper-2")}>
                  {state === "correct" || state === "answer" ? <Check className="size-4" strokeWidth={3} /> : state === "wrong" ? <X className="size-4" strokeWidth={3} /> : "ABCD"[n]}
                </span>
                <span className="prose-q" dangerouslySetInnerHTML={{ __html: html }} />
              </button>
            );
          })}
        </div>

        <div ref={after} tabIndex={-1} aria-live="polite" className="outline-none">
          {answered ? (
            <div className="anim-rise space-y-3 pt-1">
              <p className={cn("flex items-center gap-2 rounded-[10px] border-2 border-line px-3 py-2 font-display font-extrabold text-on-fill", isRight ? "bg-ok" : "bg-oops")}>
                {isRight ? <Check aria-hidden className="size-5" strokeWidth={3} /> : <X aria-hidden className="size-5" strokeWidth={3} />}
                {isRight ? `${RIGHT[i % RIGHT.length]} +10 pts` : `${WRONG[i % WRONG.length]} The answer is ${"ABCD"[q.correct]}. +2 pts for trying`}
              </p>
              <div className="ruled rounded-[10px] border-2 border-line py-2 pl-11 pr-3 text-sm">
                <p className="sr-only">Workings:</p>
                <div className="prose-q workings steps-reveal" dangerouslySetInnerHTML={{ __html: q.workingsHtml }} />
              </div>
              <Button block onClick={next} iconRight={<ArrowRight className="size-5" />}>
                {i + 1 >= questions.length ? "See my score" : "Next question"}
              </Button>
            </div>
          ) : (
            <p className="muted pt-1 text-sm">Tap an answer. You&apos;ll see the working straight away.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Streak */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Tap days on and off to see how a streak grows, and how a missed day resets it. */
export function StreakToy() {
  const [on, setOn] = useState([true, true, true, true, true, true, false]);
  // Running streak on each day (what the flame shows), and the streak "today" (Sunday).
  const run: number[] = [];
  on.forEach((d, k) => run.push(d ? (run[k - 1] ?? 0) + 1 : 0));
  const now = on[6] ? run[6] : run[5]; // like the app: today not done yet keeps yesterday's streak alive

  const message = on[6] ? "day streak. Keep it going tomorrow." : now > 0 ? "day streak. Tap Sun to keep it alive." : "Streak lost. One question today starts it again.";

  return (
    <div className="mt-5">
      <div className="flex items-end gap-1.5" role="group" aria-label="This week: tap a day to mark it practised">
        {on.map((d, k) => (
          <button
            key={DAYS[k]}
            type="button"
            aria-pressed={d}
            aria-label={`${DAYS[k]}: ${d ? "practised" : "missed"}`}
            onClick={() => setOn(on.map((v, j) => (j === k ? !v : v)))}
            className={cn(
              "flex min-h-24 flex-1 flex-col items-center justify-end gap-1 rounded-[10px] border-2 pb-1 pt-2 transition-colors",
              d ? "border-line bg-sun-soft" : "border-dashed border-line/40 hover:border-line",
            )}
          >
            <Flame days={run[k]} size={d ? 14 + Math.min(run[k], 7) * 3 : 18} animate={d && k === 6} className={d ? "" : "opacity-30 grayscale"} />
            <span className="text-xs font-bold text-ink-2">{DAYS[k].slice(0, 1)}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 font-display font-extrabold" aria-live="polite">
        {now > 0 ? <span key={now} className="num anim-bump text-2xl">{now}</span> : null} {message}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- Leaderboard */

const RIVALS = [
  { n: "Chidinma O.", p: 320 },
  { n: "Ibrahim M.", p: 280 },
  { n: "Funke A.", p: 240 },
];
const ROW = 56; // px per row, incl. gap
const PLACE = ["1st", "2nd", "3rd", "4th"];

/** Tap to earn points and watch "You" climb past the others. */
export function LeaderboardClimb() {
  const [mine, setMine] = useState(200);
  const rows = [...RIVALS.map((r) => ({ ...r, you: false })), { n: "You", p: mine, you: true }].sort((a, b) => b.p - a.p || Number(b.you) - Number(a.you));
  const rank = rows.findIndex((r) => r.you);
  const top = rank === 0;

  return (
    <div className="mt-5">
      <div className="relative" style={{ height: rows.length * ROW - 8 }} aria-hidden>
        {[...RIVALS.map((r) => r.n), "You"].map((name) => {
          const k = rows.findIndex((r) => r.n === name);
          const r = rows[k];
          return (
            <div
              key={name}
              className={cn(
                "absolute inset-x-0 flex h-12 items-center gap-3 rounded-[10px] border-2 border-line px-3 transition-transform duration-500 [transition-timing-function:var(--ease-spring)] motion-reduce:transition-none",
                k === 0 ? "bg-sun text-on-fill" : k === 1 ? "bg-silver text-on-fill" : k === 2 ? "bg-bronze text-on-fill" : "bg-card text-ink",
                r.you && "z-10 shadow-sticker",
              )}
              style={{ transform: `translateY(${k * ROW}px)` }}
            >
              {k < 3 ? <TrophyIcon place={(k + 1) as 1 | 2 | 3} size={28} /> : <span className="num grid w-7 place-items-center">{k + 1}</span>}
              <Avatar name={r.n} size="sm" />
              <span className="flex-1 font-display font-extrabold">{r.n}</span>
              <span key={r.p} className={cn("num", r.you && "anim-bump")}>{r.p}</span>
            </div>
          );
        })}
      </div>
      <ol className="sr-only">
        {rows.map((r, k) => <li key={r.n}>{PLACE[k]}: {r.n}, {r.p} points</li>)}
      </ol>
      <p className="sr-only" aria-live="polite">You are {PLACE[rank]} with {mine} points.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {top ? (
          <>
            <ButtonLink href="/signup" variant="sun" iconRight={<ArrowRight className="size-5" />}>You&apos;re top! Do it for real</ButtonLink>
            <Button variant="ghost" size="sm" onClick={() => setMine(200)} icon={<RotateCcw className="size-4" />}>Reset</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setMine((p) => p + 10)}>Answer a question · +10 pts</Button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Pricing */

export type LandingPlan = { code: string; name: string; periodDays: number; amountKobo: number };

const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;

/** Plans as a choice: picking one shows what it costs per day, and the saving against paying monthly. */
export function PlanChooser({ plans }: { plans: LandingPlan[] }) {
  const [code, setCode] = useState(plans.find((p) => p.code === "TERMLY")?.code ?? plans[0]?.code);
  const chosen = plans.find((p) => p.code === code);
  const monthly = plans.find((p) => p.code === "MONTHLY");
  const perDay = (p: LandingPlan) => p.amountKobo / p.periodDays;
  const saving = chosen && monthly && chosen.code !== monthly.code ? 1 - perDay(chosen) / perDay(monthly) : 0;

  return (
    <>
      <div role="radiogroup" aria-label="Premium plans" className="space-y-3">
        {plans.map((p) => {
          const sel = p.code === code;
          return (
            <label
              key={p.code}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 border-2 border-line px-4 py-3 transition-[transform,box-shadow] duration-150 [border-radius:var(--r-sticker)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sun",
                sel ? "-translate-y-0.5 bg-sun text-on-fill shadow-sticker-lg" : "bg-card text-ink shadow-sticker hover:-translate-y-0.5",
              )}
            >
              <input type="radio" name="landing-plan" value={p.code} checked={sel} onChange={() => setCode(p.code)} className="sr-only" />
              <span>
                <span className="block font-display text-lg font-extrabold">{p.name}</span>
                <span className="text-sm font-semibold">{p.periodDays} days{p.code === "TERMLY" ? " · a full school term" : ""}</span>
              </span>
              <span className="num text-2xl">{naira(p.amountKobo)}</span>
            </label>
          );
        })}
      </div>
      {chosen ? (
        <p key={chosen.code} className="anim-rise mt-4 rounded-[10px] border-2 border-line bg-card px-4 py-3 font-semibold text-ink" aria-live="polite">
          That&apos;s about <strong className="num text-xl">{naira(perDay(chosen))}</strong> a day
          {saving >= 0.05 ? <> · <strong>{Math.round(saving * 100)}% less</strong> than paying monthly</> : null}.
        </p>
      ) : null}
    </>
  );
}
