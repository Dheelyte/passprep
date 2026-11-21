import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { cn } from "./ds/cn";

/** Rank movement pill: Leaf for up, Soft Coral for down — always with an arrow and words. */
export function MovePill({ diff, compact }: { diff: number | null; compact?: boolean }) {
  if (diff === null) return <span className="rounded-full border-2 border-line bg-card px-1.5 text-[10px] font-extrabold uppercase">new</span>;
  if (diff === 0) return <span className="inline-flex items-center rounded-full border-2 border-line bg-card px-1" aria-label="no change"><Minus aria-hidden className="size-3.5" /></span>;
  const up = diff > 0;
  return (
    <span className={cn("inline-flex items-center rounded-full border-2 border-line px-1 text-xs font-extrabold text-on-fill", up ? "bg-ok" : "bg-oops")} aria-label={`${up ? "up" : "down"} ${Math.abs(diff)}`}>
      {up ? <ChevronUp aria-hidden className="size-3.5" strokeWidth={3} /> : <ChevronDown aria-hidden className="size-3.5" strokeWidth={3} />}
      {compact ? Math.abs(diff) : `${up ? "Up" : "Down"} ${Math.abs(diff)}`}
    </span>
  );
}

/** Rank movement vs last week, with icon + words (never colour alone). */
export function RankChange({ now, prev }: { now: number; prev: number | null }) {
  if (prev === null) return <span className="muted block text-sm">New on the board this week</span>;
  const diff = prev - now;
  return (
    <span className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
      <MovePill diff={diff} />
      {diff === 0 ? "Same as last week" : "since last week"}
    </span>
  );
}
