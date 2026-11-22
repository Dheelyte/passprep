import type { ReactNode } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./ds/theme-toggle";

/** Minimal shell for public, logged-out pages (parent pay, payment result, 404). */
export function PublicShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="graph-paper flex flex-1 flex-col">
      <div className={`mx-auto w-full flex-1 px-4 py-4 ${wide ? "max-w-2xl md:px-8 md:py-6 lg:max-w-5xl" : "max-w-md"}`}>
        <div className={`flex items-center justify-between ${wide ? "mb-6 md:mb-10" : "mb-6"}`}>
          <Logo />
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}
