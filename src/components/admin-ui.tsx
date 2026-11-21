import type { ReactNode } from "react";
export { SkeletonList } from "./ds/skeleton";
export { FormError } from "./ds/field";

/** Admin page header: calm and compact (no game styling in staff tools). */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle ? <p className="muted mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
