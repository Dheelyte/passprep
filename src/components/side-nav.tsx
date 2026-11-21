"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumn, House, Sparkles, Trophy, User } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./ds/theme-toggle";
import { cn } from "./ds/cn";

const items = [
  { href: "/dashboard", label: "Home", Icon: House, color: "bg-sun text-on-fill" },
  { href: "/subjects", label: "Practise", Icon: BookOpen, color: "bg-primary text-on-primary" },
  { href: "/leaderboard", label: "Leaderboard", Icon: Trophy, color: "bg-primary text-on-primary" },
  { href: "/progress", label: "Progress", Icon: ChartNoAxesColumn, color: "bg-coral text-on-fill" },
  { href: "/account", label: "Profile", Icon: User, color: "bg-primary text-on-primary" },
];

/** Desktop (≥1024px) sidebar. usePathname is runtime data → render inside <Suspense> with <SideBar /> as fallback. */
export function SideNav() {
  return <SideBar path={usePathname()} />;
}

export function SideBar({ path = "" }: { path?: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r-2 border-line bg-card lg:flex" aria-label="Sidebar">
      <div className="px-5 pb-4 pt-5">
        <Logo href="/dashboard" />
      </div>
      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-1.5">
          {items.map(({ href, label, Icon, color }) => {
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-[var(--r-md)] border-2 px-3 font-display text-base font-bold transition-[transform,box-shadow,background-color] duration-150",
                    active ? cn("border-line shadow-sticker-sm", color) : "border-transparent text-ink hover:border-line hover:bg-paper-2",
                  )}
                >
                  <span className={cn("grid size-8 place-items-center rounded-[8px] border-2", active ? "border-line bg-white text-[#16131f]" : "border-transparent")}>
                    <Icon aria-hidden className="size-5" strokeWidth={active ? 2.6 : 2.1} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-3 p-3">
        <Link href="/premium" className="pressable block border-2 border-line bg-grape p-3 text-on-grape shadow-sticker [border-radius:var(--r-sticker)]">
          <span className="flex items-center gap-2 font-display font-extrabold"><Sparkles aria-hidden className="size-5 text-sun" /> Go Premium</span>
          <span className="mt-0.5 block text-sm font-semibold">Unlimited questions & every video.</span>
        </Link>
        <div className="flex items-center justify-between rounded-[var(--r-md)] border-2 border-line px-3 py-1.5">
          <span className="text-sm font-bold">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
