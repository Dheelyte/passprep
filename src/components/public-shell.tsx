import type { ReactNode } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./ds/theme-toggle";

/** Minimal shell for public, logged-out pages (parent pay, payment result, 404). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="graph-paper flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-4">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}
