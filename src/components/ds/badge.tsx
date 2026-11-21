import type { ReactNode } from "react";
import { cn } from "./cn";

type ChipTone = "neutral" | "lime" | "ok" | "oops" | "info" | "subject" | "gold";
const chipTones: Record<ChipTone, string> = {
  neutral: "text-ink-2 bg-card",
  lime: "text-on-fill bg-lime border-line",
  ok: "text-ok bg-ok-soft",
  oops: "text-oops bg-oops-soft",
  info: "text-info bg-info-soft",
  subject: "text-subj-ink bg-subj-soft",
  gold: "text-on-fill bg-gold border-line",
};

/** Small pill label. Always pair colour with text (and an icon when it signals a state). */
export function Chip({ tone = "neutral", icon, children, className }: { tone?: ChipTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("chip", chipTones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Rubber-stamp badge for results and achievements. Animates in with `animate`. */
export function Stamp({ children, tone = "ok", animate, className }: { children: ReactNode; tone?: "ok" | "info" | "oops" | "lime"; animate?: boolean; className?: string }) {
  const color = { ok: "text-ok border-ok", info: "text-info border-info", oops: "text-oops border-oops", lime: "text-ink border-line bg-lime" }[tone];
  return (
    <span
      className={cn(
        "inline-block -rotate-8 border-[3px] border-double px-3 py-1 font-display text-sm font-extrabold uppercase tracking-widest [border-radius:8px_4px_9px_5px]",
        color,
        animate && "anim-stamp",
        className,
      )}
    >
      {children}
    </span>
  );
}
