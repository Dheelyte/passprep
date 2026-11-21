import type { ReactNode } from "react";
import { cn } from "./cn";

function Illo({ kind }: { kind: "empty" | "error" | "offline" | "lost" | "done" }) {
  // Small inline doodles: an exercise book, a broken pencil, a cloud, a paper plane, a tick.
  const common = { fill: "none", stroke: "var(--line)", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden viewBox="0 0 120 90" className="h-24 w-32">
      {kind === "empty" && (
        <>
          <path d="M20 18 H62 V78 H20 Z" {...common} fill="var(--card)" />
          <path d="M62 18 H100 V78 H62 Z" {...common} fill="var(--paper-2)" />
          <path d="M28 32 H54 M28 42 H54 M70 32 H92" {...common} stroke="var(--rule)" />
          <circle cx="83" cy="52" r="10" {...common} fill="var(--lime)" />
          <path d="M79 52 L82 55 L88 48" {...common} />
        </>
      )}
      {kind === "done" && (
        <>
          <circle cx="60" cy="45" r="30" {...common} fill="var(--lime)" />
          <path d="M45 46 L56 57 L76 34" {...common} strokeWidth={4} />
        </>
      )}
      {kind === "error" && (
        <>
          <path d="M18 62 L58 22 L66 30 L26 70 Z" {...common} fill="var(--gold)" />
          <path d="M70 40 L96 14 L104 22 L78 48 Z" {...common} fill="var(--gold)" />
          <path d="M18 62 L14 74 L26 70" {...common} fill="var(--card)" />
          <path d="M60 46 L66 40 M64 52 L72 50 M58 56 L60 64" {...common} stroke="var(--oops)" />
        </>
      )}
      {kind === "offline" && (
        <>
          <path d="M30 62 C16 62, 14 44, 28 42 C28 26, 50 22, 58 34 C64 24, 84 26, 84 42 C98 42, 98 62, 84 62 Z" {...common} fill="var(--card)" />
          <path d="M40 72 L80 30" {...common} stroke="var(--oops)" />
        </>
      )}
      {kind === "lost" && (
        <>
          <path d="M12 46 L104 14 L74 76 L58 52 Z" {...common} fill="var(--card)" />
          <path d="M58 52 L104 14" {...common} />
          <path d="M20 78 C34 70, 30 60, 44 62" {...common} strokeDasharray="4 6" />
        </>
      )}
    </svg>
  );
}

export function EmptyState({ title, body, action, kind = "empty", className }: { title: string; body?: ReactNode; action?: ReactNode; kind?: "empty" | "done" | "lost"; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-[var(--r-sticker)] border-2 border-dashed border-ink-2/50 px-5 py-8 text-center", className)}>
      <Illo kind={kind} />
      <h2 className="text-lg font-extrabold">{title}</h2>
      {body ? <p className="muted max-w-xs text-sm">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Wahala — something broke", body, action, offline }: { title?: string; body?: ReactNode; action?: ReactNode; offline?: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-[var(--r-sticker)] border-2 border-line bg-oops-soft px-5 py-8 text-center">
      <Illo kind={offline ? "offline" : "error"} />
      <h2 className="text-lg font-extrabold">{offline ? "You're offline" : title}</h2>
      <p className="max-w-xs text-sm">{offline ? "Check your data or Wi-Fi, then try again. Your streak is safe." : body ?? "It's not you, it's us. Try again in a moment."}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
