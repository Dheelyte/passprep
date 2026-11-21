import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="muted mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-16" />
      ))}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
      {message}
    </p>
  );
}

const masteryStyle = {
  strong: "bg-ok-soft text-ok",
  ok: "bg-accent-soft text-[#8a5a00] dark:text-accent",
  weak: "bg-bad-soft text-bad",
  new: "bg-surface-2 text-muted",
} as const;
const masteryLabel = { strong: "Strong", ok: "Getting there", weak: "Needs work", new: "Not enough data" } as const;

export function MasteryChip({ mastery }: { mastery: keyof typeof masteryStyle }) {
  return <span className={`chip ${masteryStyle[mastery]}`}>{masteryLabel[mastery]}</span>;
}

export function StreakFlame({ days, size = "md" }: { days: number; size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${size === "lg" ? "text-3xl" : "text-base"}`}>
      <svg aria-hidden viewBox="0 0 24 24" className={size === "lg" ? "size-8" : "size-5"}>
        <path
          fill={days > 0 ? "var(--accent)" : "var(--border)"}
          d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3-1-5 1-8z"
        />
      </svg>
      {days}
      <span className="sr-only"> day streak</span>
    </span>
  );
}
