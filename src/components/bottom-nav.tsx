"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumn, House, Trophy } from "lucide-react";
import { cn } from "./ds/cn";

const items = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/subjects", label: "Practise", Icon: BookOpen },
  { href: "/leaderboard", label: "Ranks", Icon: Trophy },
  { href: "/progress", label: "Progress", Icon: ChartNoAxesColumn },
];

/** Active-state nav. usePathname is runtime data, so render it inside <Suspense> with <NavBar /> as fallback. */
export function BottomNav() {
  return <NavBar path={usePathname()} />;
}

export function NavBar({ path = "" }: { path?: string }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex min-h-16 flex-col items-center justify-center gap-0.5 font-display text-xs font-bold"
              >
                <span
                  className={cn(
                    "grid h-8 w-12 place-items-center rounded-full border-2 transition-[transform,background-color] duration-200 group-active:scale-95",
                    active ? "border-line bg-primary text-on-primary" : "border-transparent text-ink-2 group-hover:bg-paper-2",
                  )}
                >
                  <Icon aria-hidden className="size-5" strokeWidth={active ? 2.6 : 2} />
                </span>
                <span className={active ? "text-ink" : "text-ink-2"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
