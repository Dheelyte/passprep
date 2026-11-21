"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

/**
 * Bottom sheet on phones, centred modal from `sm` up. Built on <dialog> so focus trapping,
 * Escape-to-close and the backdrop come from the browser.
 */
export function Sheet({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        "m-0 mt-auto w-full max-w-none border-2 border-line bg-card p-0 text-ink backdrop:bg-[#0e1524]/60",
        "rounded-t-[22px] [animation:sheet-up_var(--dur-slow)_var(--ease-out)]",
        "sm:m-auto sm:max-w-lg sm:rounded-[var(--r-sticker)] sm:shadow-sticker-lg sm:[animation:rise-in_var(--dur)_var(--ease-out)]",
        className,
      )}
    >
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-rule sm:hidden" aria-hidden />
      <div className="flex items-center justify-between gap-3 px-5 pt-3">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <button type="button" onClick={onClose} className="btn-ghost min-h-10 px-2" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[80dvh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
    </dialog>
  );
}
