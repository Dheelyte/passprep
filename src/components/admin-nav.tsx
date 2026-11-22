"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChartNoAxesColumn, ClipboardCheck, Flag, LayoutDashboard, ListChecks, Menu, Upload, User, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./ds/theme-toggle";
import { cn } from "./ds/cn";

export const adminLinks = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/import", label: "Import", Icon: Upload },
  { href: "/admin/review", label: "Review", Icon: ClipboardCheck },
  { href: "/admin/questions", label: "Questions", Icon: ListChecks },
  { href: "/admin/flags", label: "Flags", Icon: Flag },
  { href: "/admin/metrics", label: "Metrics", Icon: ChartNoAxesColumn },
];

const isActive = (path: string, href: string) => (href === "/admin" ? path === href : path === href || path.startsWith(`${href}/`));

/** usePathname is runtime data → render inside <Suspense> with <AdminNavView /> as fallback. */
export function AdminNav() {
  return <AdminNavView path={usePathname()} />;
}

/** ≥768px: links in the header. <768px: a menu button that opens a sidebar drawer. */
export function AdminNavView({ path = "" }: { path?: string }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const close = () => drawer.current?.close();

  // Close the drawer after navigating.
  useEffect(() => {
    drawer.current?.close();
  }, [path]);

  return (
    <>
      <nav aria-label="Admin" className="hidden flex-wrap gap-1 text-sm md:flex">
        {adminLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(path, l.href) ? "page" : undefined}
            className={cn("rounded-lg px-3 py-2 font-medium hover:bg-paper-2", isActive(path, l.href) && "bg-paper-2 font-semibold")}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/account" className="rounded-lg px-3 py-2 font-medium text-ink-2 hover:bg-paper-2">Account</Link>
      </nav>

      <button
        type="button"
        className="btn-ghost ml-auto min-h-11 px-2.5 md:hidden"
        aria-label="Open admin menu"
        aria-haspopup="dialog"
        onClick={() => drawer.current?.showModal()}
      >
        <Menu aria-hidden className="size-6" />
      </button>

      <dialog
        ref={drawer}
        aria-label="Admin menu"
        className="admin-drawer m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-rule bg-card p-0 text-ink backdrop:bg-black/50 md:hidden"
        // Tap on the backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <Logo href="/admin" />
            <button type="button" className="btn-ghost min-h-11 px-2.5" aria-label="Close menu" onClick={close}>
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <p className="chip mx-4 mt-4 self-start text-ink-2">Content admin</p>
          <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-1">
              {adminLinks.map(({ href, label, Icon }) => {
                const active = isActive(path, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 font-medium", active ? "bg-paper-2 font-semibold" : "hover:bg-paper-2")}
                    >
                      <Icon aria-hidden className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="space-y-2 border-t border-rule p-3">
            <Link href="/account" onClick={close} className="flex min-h-12 items-center gap-3 rounded-lg px-3 font-medium text-ink-2 hover:bg-paper-2">
              <User aria-hidden className="size-5" /> Account
            </Link>
            <div className="flex items-center justify-between rounded-lg px-3 py-1.5">
              <span className="text-sm font-semibold">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
