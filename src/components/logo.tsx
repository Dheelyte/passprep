import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <svg aria-hidden viewBox="0 0 64 64" className="size-7">
        <rect width="64" height="64" rx="14" fill="var(--brand)" />
        <path d="M18 34l9 9 19-21" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {BRAND.name}
    </Link>
  );
}
