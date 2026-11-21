"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "./cn";

/** A single transient message. Parent controls it; auto-dismisses after `duration`. */
export function Toast({ message, icon, onDone, duration = 3200, tone = "ink" }: { message: ReactNode | null; icon?: ReactNode; onDone: () => void; duration?: number; tone?: "ink" | "lime" }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDone]);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      {message ? (
        <div className={cn("anim-rise pointer-events-auto flex max-w-sm items-center gap-2 border-2 border-line px-4 py-3 font-display font-bold shadow-sticker [border-radius:var(--r-sticker)]", tone === "lime" ? "bg-lime text-on-fill" : "bg-ink text-paper")}>
          {icon}
          {message}
        </div>
      ) : null}
    </div>
  );
}
