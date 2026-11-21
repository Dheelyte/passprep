import type { ReactNode } from "react";
import { cn } from "./cn";

/** Hand-drawn marker underline under key words. */
export function Underline({ children, color = "var(--sun)" }: { children: ReactNode; color?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" className="absolute -bottom-1 left-0 z-0 h-3.5 w-full">
        <path d="M3 11 C 40 4, 90 3, 197 8 M 8 13 C 70 9, 130 9, 190 12" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Pen circle around a word or number. */
export function Circled({ children, color = "var(--physics)" }: { children: ReactNode; color?: string }) {
  return (
    <span className="relative inline-block px-1.5">
      {children}
      <svg aria-hidden viewBox="0 0 120 60" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-1 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+8px)]">
        <path d="M60 4 C 18 3, 3 22, 8 38 C 14 56, 96 60, 112 40 C 124 22, 104 4, 52 7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Margin note: a small handwritten-style aside in explanations. */
export function MarginNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("relative border-l-[3px] border-physics bg-physics-soft/60 py-1 pl-3 pr-2 font-display text-sm font-semibold italic text-physics-ink [border-radius:0_8px_8px_0]", className)}>
      {children}
    </p>
  );
}

/** Little doodle arrow pointing right-down. */
export function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 80 50" className={cn("h-10 w-16", className)}>
      <path d="M4 8 C 30 2, 58 12, 66 38" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M56 32 L 67 40 L 72 27" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
