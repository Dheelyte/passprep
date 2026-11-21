import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";
import { Logo } from "@/components/logo";
import { BottomNav, NavBar } from "@/components/bottom-nav";
import { SideBar, SideNav } from "@/components/side-nav";
import { ThemeToggle } from "@/components/ds/theme-toggle";

// Phones/tablets: top bar + bottom tab bar. Desktop (≥1024px): fixed left sidebar, wide content column.
export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="with-sidebar flex flex-1 flex-col lg:pl-[var(--sidebar-w)]">
      <header className="sticky top-0 z-30 border-b-2 border-line bg-paper lg:hidden">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/account" className="btn-ghost min-h-10 px-2.5" aria-label="Your profile">
              <User className="size-5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5 sm:max-w-2xl lg:max-w-6xl lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      <Suspense fallback={<NavBar />}>
        <BottomNav />
      </Suspense>
      <Suspense fallback={<SideBar />}>
        <SideNav />
      </Suspense>
    </div>
  );
}
