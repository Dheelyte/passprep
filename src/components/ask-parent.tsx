"use client";

import { useState, useTransition } from "react";
import { getParentLink } from "@/app/actions/billing";
import { BRAND } from "@/lib/brand";

export function AskParent({ firstName }: { firstName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const message = (u: string) =>
    `Hi! I'm using ${BRAND.name} to practise for my exams. Premium gives me unlimited questions and video solutions. You can pay by bank transfer here: ${u} — ${firstName}`;

  if (!url) {
    return (
      <button type="button" className="btn-secondary w-full" disabled={pending} onClick={() => start(async () => setUrl((await getParentLink()).url))}>
        {pending ? "Creating link…" : "Create a payment link for my parent"}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <p className="break-all rounded-xl bg-surface-2 px-3 py-2 text-sm">{url}</p>
      <div className="grid grid-cols-2 gap-2">
        <a className="btn-primary" href={`https://wa.me/?text=${encodeURIComponent(message(url))}`} target="_blank" rel="noopener noreferrer">
          Send on WhatsApp
        </a>
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ text: message(url) });
              else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              }
            } catch {
              /* user cancelled share */
            }
          }}
        >
          {copied ? "Copied!" : "Share / copy"}
        </button>
      </div>
      <p className="muted text-xs">The link works for 14 days. Your parent doesn&apos;t need an account.</p>
    </div>
  );
}
