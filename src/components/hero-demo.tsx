"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Flame } from "./ds/rewards";
import { cn } from "./ds/cn";

/**
 * Looping, self-answering question card for the landing hero.
 * Steps: 0 idle → 1 tap wrong → 2 wrong shown → 3 workings → 4 next q tap right → 5 correct + points.
 * Reduced motion: shows the final "correct" state without looping.
 */
export function HeroDemo({ stemHtml, optionsHtml, workingsHtml }: { stemHtml: string; optionsHtml: string[]; workingsHtml: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setStep(5), 0);
      return () => clearTimeout(t);
    }
    const durations = [1400, 700, 1300, 2600, 800, 2400];
    let s = 0;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      s = (s + 1) % durations.length;
      setStep(s);
      t = setTimeout(next, durations[s]);
    };
    t = setTimeout(next, durations[0]);
    return () => clearTimeout(t);
  }, []);

  const chosen = step >= 4 ? 0 : step >= 1 ? 2 : null;
  const revealed = step >= 2;
  const correct = step >= 5;
  const streak = correct ? 7 : 6;
  const points = correct ? 1250 : 1240;

  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      {/* floating streak + points chips */}
      <div className="absolute -top-5 left-3 z-10 flex -rotate-3 items-center gap-1 rounded-full border-2 border-line bg-card px-3 py-1 shadow-sticker-sm">
        <Flame days={streak} size={18} />
        <span key={streak} className="num anim-bump text-base">{streak}</span>
        <span className="text-xs font-bold">day streak</span>
      </div>
      <div className="absolute -top-4 right-3 z-10 rotate-3 rounded-full border-2 border-line bg-sun px-3 py-1 text-on-fill shadow-sticker-sm">
        <span key={points} className="num anim-bump text-base">{points.toLocaleString("en-NG")}</span> <span className="text-xs font-bold">pts</span>
        {correct ? <span className="anim-float absolute -top-3 right-2 font-display text-sm font-extrabold text-ok-ink">+10</span> : null}
      </div>

      <div className="sticker graph-paper overflow-hidden p-0 shadow-sticker-lg" data-subject="mathematics">
        <div className="flex items-center justify-between border-b-2 border-line bg-subj px-4 py-2 text-sm text-on-subj">
          <span className="font-display font-extrabold">Indices · Q{step >= 4 ? 4 : 3} of 10</span>
          <span className="chip bg-card text-ink-2">Medium</span>
        </div>
        <div className="space-y-2.5 p-4">
          <div className="prose-q rounded-[8px] bg-card/90 px-2 py-1 font-semibold" dangerouslySetInnerHTML={{ __html: stemHtml }} />
          {optionsHtml.map((html, i) => {
            const isRight = i === 0;
            const state = !revealed && chosen === i ? "pending" : revealed && chosen === i ? (isRight ? "correct" : "wrong") : revealed && isRight && step >= 2 && step < 4 ? "answer" : "idle";
            return (
              <div
                key={i}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 border-2 border-line px-2.5 py-1.5 text-sm transition-[transform,box-shadow,background-color] duration-200 [border-radius:var(--r-sticker)]",
                  state === "idle" && "bg-card shadow-sticker-sm",
                  state === "pending" && "translate-x-[2px] translate-y-[2px] bg-sun-soft",
                  state === "correct" && "anim-pop bg-ok-soft shadow-sticker-sm",
                  state === "wrong" && "anim-shake bg-oops-soft",
                  state === "answer" && "border-dashed bg-ok-soft",
                )}
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-[6px] border-2 border-line font-display text-xs font-extrabold", state === "correct" || state === "answer" ? "bg-ok text-on-fill" : state === "wrong" ? "bg-oops text-on-fill" : "bg-paper-2")}>
                  {state === "correct" || state === "answer" ? <Check className="size-4" strokeWidth={3} /> : state === "wrong" ? <X className="size-4" strokeWidth={3} /> : "ABCD"[i]}
                </span>
                <span className="prose-q" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            );
          })}
          {step >= 3 && step < 4 ? (
            <div className="ruled anim-rise rounded-[10px] border-2 border-line py-2 pl-11 pr-3 text-sm">
              <div className="prose-q workings steps-reveal" dangerouslySetInnerHTML={{ __html: workingsHtml }} />
            </div>
          ) : null}
          {correct ? (
            <p className="anim-rise flex items-center gap-2 rounded-[10px] border-2 border-line bg-sun px-3 py-2 font-display font-extrabold text-on-fill">
              <Check className="size-5" strokeWidth={3} /> Sharp! +10 pts
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
