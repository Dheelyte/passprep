import { cn } from "./cn";

/** Thin bar. `value` 0..max. Uses transform so updates animate cheaply. */
export function ProgressBar({ value, max = 100, label, tone = "sun", className, size = "md" }: { value: number; max?: number; label: string; tone?: "sun" | "primary" | "subject" | "ok"; className?: string; size?: "sm" | "md" }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const fill = { sun: "bg-sun", primary: "bg-primary", subject: "bg-subj", ok: "bg-ok" }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("overflow-hidden rounded-full border-2 border-line bg-card", size === "sm" ? "h-2.5" : "h-3.5", className)}
    >
      <div className={cn("h-full origin-left transition-transform duration-300 ease-out", fill)} style={{ transform: `scaleX(${pct})` }} />
    </div>
  );
}

/** Ring for mastery/accuracy. Text in the middle is optional. */
export function ProgressRing({ value, size = 56, stroke = 7, label, children, tone = "subject" }: { value: number; size?: number; stroke?: number; label: string; children?: React.ReactNode; tone?: "subject" | "sun" | "primary" | "ok" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const color = { subject: "var(--subj, var(--general))", sun: "var(--sun)", primary: "var(--primary)", ok: "var(--ok)" }[tone];
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="var(--card)" stroke="color-mix(in oklab, var(--card) 70%, var(--ink) 12%)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke="var(--line)" strokeWidth={1.5} />
      </svg>
      {children ? <span className="absolute inset-0 grid place-items-center">{children}</span> : null}
    </div>
  );
}
