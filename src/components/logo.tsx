import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" width={size} height={size} className="shrink-0 -rotate-6">
      <rect x="3" y="3" width="34" height="34" rx="9" fill="var(--shadow-ink)" />
      <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--sun)" stroke="var(--line)" strokeWidth="2.5" />
      <path d="M10 19 L16 25 L27 11" fill="none" stroke="#16131f" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-10 items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label={`${BRAND.name} home`}>
      <LogoMark />
      {BRAND.name}
    </Link>
  );
}
