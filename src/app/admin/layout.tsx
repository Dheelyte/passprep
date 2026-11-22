import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ds/theme-toggle";
import { AdminNav, AdminNavView } from "@/components/admin-nav";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="calm flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-rule bg-card md:static">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo href="/admin" />
          <span className="chip text-ink-2 max-sm:hidden">Content admin</span>
          <Suspense fallback={<AdminNavView />}>
            <AdminNav />
          </Suspense>
          <ThemeToggle className="ml-auto max-md:hidden" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
