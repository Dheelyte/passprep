// Distraction-free layout for practice: no header or bottom nav, graph-paper desk.
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <main className="graph-paper flex min-h-dvh flex-1 flex-col">{children}</main>;
}
