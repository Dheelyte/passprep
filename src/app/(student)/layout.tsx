import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { BottomNav, NavBar } from "@/components/bottom-nav";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Logo href="/dashboard" />
          <Link href="/account" className="btn-ghost min-h-10 px-3 text-sm" aria-label="Account">
            <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-4">{children}</main>
      <Suspense fallback={<NavBar />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
