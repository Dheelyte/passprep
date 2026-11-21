import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ds/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="graph-paper flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
