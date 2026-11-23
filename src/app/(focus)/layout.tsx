import type { Metadata } from "next";

// Signed-in area: keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Distraction-free layout for practice: no header or bottom nav, graph-paper desk.
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <main className="graph-paper flex min-h-dvh flex-1 flex-col">{children}</main>;
}
