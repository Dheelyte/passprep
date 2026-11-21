"use client";
import { useFormStatus } from "react-dom";

export function StartButton({ label = "Practise", className = "btn-primary min-h-10 px-4 text-sm" }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? "Loading…" : label}
    </button>
  );
}
