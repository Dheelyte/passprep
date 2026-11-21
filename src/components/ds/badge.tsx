import type { ReactNode } from "react";
import { cn } from "./cn";

type ChipTone = "neutral" | "sun" | "primary" | "coral" | "grape" | "ok" | "oops" | "info" | "subject" | "subject-fill" | "gold";
const chipTones: Record<ChipTone, string> = {
  neutral: "text-ink-2 bg-card",
  sun: "text-on-fill bg-sun border-line",
  gold: "text-on-fill bg-sun border-line",
  primary: "text-on-primary bg-primary border-line",
  coral: "text-on-fill bg-coral border-line",
  grape: "text-on-grape bg-grape border-line",
  ok: "text-ok-ink bg-ok-soft",
  oops: "text-oops-ink bg-oops-soft",
  info: "text-primary-ink bg-primary-soft",
  subject: "text-subj-ink bg-subj-soft",
  "subject-fill": "text-on-subj bg-subj border-line",
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
export function Stamp({ children, tone = "ok", animate, className }: { children: ReactNode; tone?: "ok" | "info" | "oops" | "sun" | "primary"; animate?: boolean; className?: string }) {
  // Stamps are filled so the ink text always has contrast in both themes.
  const color = { ok: "text-on-fill border-line bg-ok", info: "text-on-primary border-line bg-primary", primary: "text-on-primary border-line bg-primary", oops: "text-on-fill border-line bg-oops", sun: "text-on-fill border-line bg-sun" }[tone];
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
