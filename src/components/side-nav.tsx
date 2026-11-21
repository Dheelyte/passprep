"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumn, House, Sparkles, Trophy, User } from "lucide-react";
import { Logo, LogoMark } from "./logo";
import { ThemeToggle } from "./ds/theme-toggle";
import { cn } from "./ds/cn";

const items = [
  { href: "/dashboard", label: "Home", Icon: House, color: "bg-sun text-on-fill" },
  { href: "/subjects", label: "Practise", Icon: BookOpen, color: "bg-primary text-on-primary" },
  { href: "/leaderboard", label: "Leaderboard", Icon: Trophy, color: "bg-primary text-on-primary" },
  { href: "/progress", label: "Progress", Icon: ChartNoAxesColumn, color: "bg-coral text-on-fill" },
  { href: "/account", label: "Profile", Icon: User, color: "bg-primary text-on-primary" },
];

/** Sidebar from 768px up. usePathname is runtime data → render inside <Suspense> with <SideBar /> as fallback. */
export function SideNav() {
  return <SideBar path={usePathname()} />;
}

/**
 * Lives in the first column of the layout grid (sticky, full height), so it never overlaps content.
 * 768–1023px: compact icon rail (labels become tooltips/aria-labels). ≥1024px: full sidebar with labels.
 */
export function SideBar({ path = "" }: { path?: string }) {
  return (
    <aside
      aria-label="Sidebar"
      className="hidden h-dvh flex-col overflow-y-auto border-r-2 border-line bg-card md:sticky md:top-0 md:col-start-1 md:row-start-1 md:flex"
    >
      <div className="flex justify-center px-3 pb-4 pt-5 lg:justify-start lg:px-5">
        <span className="lg:hidden">
          <Link href="/dashboard" aria-label="Home" className="grid min-h-11 place-items-center"><LogoMark size={34} /></Link>
        </span>
        <span className="hidden lg:block"><Logo href="/dashboard" /></span>
      </div>
      <nav aria-label="Main" className="flex-1 px-2.5 lg:px-3">
        <ul className="space-y-1.5">
          {items.map(({ href, label, Icon, color }) => {
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={label}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-3 rounded-[var(--r-md)] border-2 px-2 font-display text-base font-bold transition-[transform,box-shadow,background-color] duration-150 lg:justify-start lg:px-3",
                    active ? cn("border-line shadow-sticker-sm", color) : "border-transparent text-ink hover:border-line hover:bg-paper-2",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-[8px] border-2", active ? "border-line bg-white text-[#16131f]" : "border-transparent")}>
                    <Icon aria-hidden className="size-5" strokeWidth={active ? 2.6 : 2.1} />
                  </span>
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-3 p-2.5 lg:p-3">
        <Link
          href="/premium"
          title="Go Premium"
          aria-label="Go Premium: unlimited questions and every video"
          className="pressable flex items-center justify-center border-2 border-line bg-grape p-2.5 text-on-grape shadow-sticker [border-radius:var(--r-sticker)] lg:block lg:p-3"
        >
          <Sparkles aria-hidden className="size-5 text-sun lg:hidden" />
          <span className="hidden items-center gap-2 font-display font-extrabold lg:flex"><Sparkles aria-hidden className="size-5 text-sun" /> Go Premium</span>
          <span className="mt-0.5 hidden text-sm font-semibold lg:block">Unlimited questions & every video.</span>
        </Link>
        <div className="flex items-center justify-center rounded-[var(--r-md)] border-2 border-line px-2 py-1.5 lg:justify-between lg:px-3">
          <span className="hidden text-sm font-bold lg:inline">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
