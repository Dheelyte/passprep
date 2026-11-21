import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/flags", label: "Flags" },
  { href: "/admin/metrics", label: "Metrics" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo href="/admin" />
          <span className="chip bg-surface-2 text-muted">Content admin</span>
          <nav aria-label="Admin" className="flex flex-wrap gap-1 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 font-medium hover:bg-surface-2">{l.label}</Link>
            ))}
            <Link href="/account" className="rounded-lg px-3 py-2 font-medium text-muted hover:bg-surface-2">Account</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
