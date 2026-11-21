import { Check, CircleAlert, Minus, TrendingUp } from "lucide-react";
import type { Mastery } from "@/lib/progress";
import { Chip } from "./ds/badge";

const map = {
  strong: { tone: "ok", label: "Strong", Icon: Check },
  ok: { tone: "info", label: "Getting there", Icon: TrendingUp },
  weak: { tone: "oops", label: "Needs work", Icon: CircleAlert },
  new: { tone: "neutral", label: "Not enough yet", Icon: Minus },
} as const;

/** Mastery label: icon + words, never colour alone. */
export function MasteryChip({ mastery }: { mastery: Mastery }) {
  const m = map[mastery];
  return <Chip tone={m.tone} icon={<m.Icon aria-hidden className="size-3" strokeWidth={3} />}>{m.label}</Chip>;
}

/** Horizontal accuracy bar with the % printed (subject colour). */
export function AccuracyBar({ accuracy, label }: { accuracy: number | null; label: string }) {
  const pct = accuracy === null ? 0 : Math.round(accuracy * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-line bg-card" role="img" aria-label={`${label}: ${accuracy === null ? "no data" : `${pct}%`}`}>
        <div className="h-full origin-left bg-subj" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <span className="num w-10 text-right text-sm">{accuracy === null ? "–" : `${pct}%`}</span>
    </div>
  );
}
