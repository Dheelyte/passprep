import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/** Label + control + hint/error, wired with ids for screen readers. */
export function Field({ id, label, hint, error, children }: { id: string; label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="muted mt-1 text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn("input", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn("input min-h-24 py-2", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn("input appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)", backgroundSize: "6px 6px, 6px 6px", backgroundPosition: "calc(100% - 18px) 55%, calc(100% - 12px) 55%" }} {...rest}>
      {children}
    </select>
  );
}

/** Form-level error banner. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[var(--r-md)] border-2 border-danger bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
      {message}
    </p>
  );
}
