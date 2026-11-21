import type { ReactNode } from "react";
import { cn } from "./cn";

export type BlockTone = "primary" | "sun" | "coral" | "grape" | "subject";
export const blockTones: Record<BlockTone, string> = {
  primary: "bg-primary text-on-primary",
  sun: "bg-sun text-on-fill",
  coral: "bg-coral text-on-fill",
  grape: "bg-grape text-on-grape",
  subject: "bg-subj text-on-subj",
};

/**
 * Bold, full-width colour block at the top of a screen (the screen's dominant colour).
 * Sits flush under the app header and bleeds to the viewport edges.
 */
export function ScreenHeader({ tone, title, subtitle, eyebrow, children, className }: { tone: BlockTone; title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <header className={cn("bleed -mt-5 mb-6 border-b-2 border-line pb-6 pt-5", blockTones[tone], className)}>
      {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-1.5 font-semibold">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
