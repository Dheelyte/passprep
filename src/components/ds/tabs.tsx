import Link from "next/link";
import { cn } from "./cn";

/** URL-driven tabs (state lives in the link, so they work without JS). */
export function Tabs({ items, current, label }: { items: { href: string; label: string; id: string }[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto rounded-[var(--r-md)] border-2 border-line bg-card p-1">
      {items.map((t) => {
        const active = t.id === current;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 flex-1 items-center justify-center whitespace-nowrap rounded-[7px] px-3 font-display text-sm font-bold transition-colors",
              active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
