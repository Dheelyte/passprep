import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type Tone = "card" | "paper" | "primary" | "sun" | "coral" | "grape" | "subject" | "subject-soft" | "ok" | "oops" | "info";
const tones: Record<Tone, string> = {
  card: "bg-card",
  paper: "bg-paper-2",
  primary: "bg-primary text-on-primary",
  sun: "bg-sun text-on-fill",
  coral: "bg-coral text-on-fill",
  grape: "bg-grape text-on-grape",
  subject: "bg-subj text-on-subj",
  "subject-soft": "bg-subj-soft",
  ok: "bg-ok-soft",
  oops: "bg-oops-soft",
  info: "bg-primary-soft",
};

type CardProps = { tone?: Tone; flat?: boolean; padded?: boolean; className?: string; children?: ReactNode };

function cardClass({ tone = "card", flat, padded = true, interactive, className }: CardProps & { interactive?: boolean }) {
  return cn(
    "block border-2 border-line [border-radius:var(--r-sticker)]",
    flat ? "" : "shadow-sticker",
    interactive && "pressable",
    padded && "p-4",
    tones[tone],
    className,
  );
}

/** Sticker card. `flat` drops the offset shadow (use for nested/secondary surfaces). */
export function Card({ as = "div", tone, flat, padded, className, children, ...rest }: CardProps & { as?: "div" | "section" | "article" | "li" | "aside" } & Omit<ComponentProps<"div">, "className">) {
  const As = as as "div"; // same props for every block element we allow
  return (
    <As className={cardClass({ tone, flat, padded, className })} {...rest}>
      {children}
    </As>
  );
}

/** Whole-card link that presses down like a button. */
export function CardLink({ tone, flat, padded, className, children, ...rest }: CardProps & Omit<ComponentProps<typeof Link>, "className">) {
  return (
    <Link className={cardClass({ tone, flat, padded, interactive: true, className })} {...rest}>
      {children}
    </Link>
  );
}
