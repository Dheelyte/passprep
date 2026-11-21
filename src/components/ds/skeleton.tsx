import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Wraps skeletons with an accessible busy label. */
export function Loading({ label = "Loading", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <Loading>
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </Loading>
  );
}

export function SkeletonDashboard() {
  return (
    <Loading label="Loading your day">
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      </div>
    </Loading>
  );
}

export function SkeletonQuestion() {
  return (
    <Loading label="Loading question">
      <div className="space-y-4">
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="h-28" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
      </div>
    </Loading>
  );
}

export function SkeletonPath() {
  return (
    <Loading label="Loading topics">
      <div className="space-y-4">
        <Skeleton className="h-24" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("flex items-center gap-3", i % 2 ? "pl-16" : "pl-4")}>
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ))}
      </div>
    </Loading>
  );
}
