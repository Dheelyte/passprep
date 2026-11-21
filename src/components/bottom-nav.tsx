"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home", icon: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" },
  { href: "/subjects", label: "Practise", icon: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zm0 16V5m4 2h7" },
  { href: "/leaderboard", label: "Ranks", icon: "M8 21V11m4 10V5m4 16v-7M4 21h16" },
  { href: "/progress", label: "Progress", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
];

/** Active-state nav. usePathname is runtime data, so render it inside <Suspense> with <NavBar /> as fallback. */
export function BottomNav() {
  return <NavBar path={usePathname()} />;
}

export function NavBar({ path = "" }: { path?: string }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(`${it.href}/`);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? "text-brand" : "text-muted"}`}
              >
                <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={it.icon} />
                </svg>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
