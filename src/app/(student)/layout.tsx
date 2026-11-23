import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";
import { Logo } from "@/components/logo";
import { BottomNav, NavBar } from "@/components/bottom-nav";
import { SideBar, SideNav } from "@/components/side-nav";
import { ThemeToggle } from "@/components/ds/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { isPremium } from "@/lib/entitlements";

// Responsive shell (a real two-column grid, so the sidebar can never cover content):
//   < 768px   top bar + bottom tab bar
//   768–1023  icon rail (5.5rem) + content
//   ≥ 1024    full sidebar (16rem) + wide content
export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col md:grid md:grid-cols-[var(--rail-w)_minmax(0,1fr)] md:items-start lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
      <Suspense fallback={<SideBar />}>
        <SideNavWithPlan />
      </Suspense>
      <div className="app-column flex min-w-0 flex-1 flex-col md:col-start-2 md:row-start-1 md:min-h-dvh">
        <header className="sticky top-0 z-30 border-b-2 border-line bg-paper md:hidden">
          <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
            <Logo href="/dashboard" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link href="/account" className="btn-ghost min-h-10 px-2.5" aria-label="Your profile">
                <User className="size-5" />
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5 md:max-w-3xl md:px-8 md:pb-12 md:pt-8 lg:max-w-6xl lg:px-10">{children}</main>
      </div>
      <Suspense fallback={<NavBar />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}

/** Hides "Go Premium" for Premium students. getCurrentUser is cached per request, so this adds no query. */
async function SideNavWithPlan() {
  const user = await getCurrentUser();
  return <SideNav premium={isPremium(user?.subscription)} />;
}
