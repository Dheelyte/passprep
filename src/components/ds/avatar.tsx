import { cn } from "./cn";

const fills = ["var(--maths)", "var(--physics)", "var(--chemistry)", "var(--biology)", "var(--english)", "var(--lime)", "var(--gold)"];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** Initials avatar with a colour that stays the same for the same name. */
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  const dims = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-20 text-2xl" }[size];
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full border-2 border-line font-display font-extrabold uppercase text-on-fill", dims, className)}
      style={{ background: fills[hash(name) % fills.length] }}
    >
      {initials}
    </span>
  );
}
