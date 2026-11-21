import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "sun" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  sun: "btn-sun",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "",
  lg: "min-h-14 px-6 text-lg",
};

export function buttonClass(opts: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return cn(variants[opts.variant ?? "primary"], sizes[opts.size ?? "md"], opts.block && "w-full", opts.className);
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; icon?: ReactNode; iconRight?: ReactNode };

/** Native button. `loading` shows a spinner, keeps the label for screen readers and disables the button. */
export function Button({ variant, size, block, icon, iconRight, loading, className, children, disabled, ...rest }: Common & ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button className={buttonClass({ variant, size, block, className })} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : icon}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}

/** Link styled as a button. */
export function ButtonLink({ variant, size, block, icon, iconRight, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </Link>
  );
}
