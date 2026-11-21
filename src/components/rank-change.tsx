import { ChevronDown, ChevronUp, Minus } from "lucide-react";

/** Rank movement vs last week, with icon + words (never colour alone). */
export function RankChange({ now, prev }: { now: number; prev: number | null }) {
  if (prev === null) return <span className="muted block text-sm">New on the board this week</span>;
  const diff = prev - now;
  if (diff === 0) return <span className="flex items-center gap-1 text-sm font-bold text-ink-2"><Minus aria-hidden className="size-4" /> Same as last week</span>;
  return diff > 0 ? (
    <span className="flex items-center gap-1 text-sm font-bold text-ok"><ChevronUp aria-hidden className="size-4" strokeWidth={3} /> Up {diff} from last week</span>
  ) : (
    <span className="flex items-center gap-1 text-sm font-bold text-oops"><ChevronDown aria-hidden className="size-4" strokeWidth={3} /> Down {-diff} from last week</span>
  );
}
