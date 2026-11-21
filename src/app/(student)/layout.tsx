import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { BottomNav, NavBar } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/ds/theme-toggle";
import { User } from "lucide-react";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-line bg-paper/95">
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
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5">{children}</main>
      <Suspense fallback={<NavBar />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
