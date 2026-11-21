"use client";

import { useState, useTransition } from "react";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { getParentLink } from "@/app/actions/billing";
import { BRAND } from "@/lib/brand";
import { Button } from "./ds/button";
import { buttonClass } from "./ds/button";

export function AskParent({ firstName }: { firstName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const message = (u: string) =>
    `Hi! I'm using ${BRAND.name} to practise for my exams. Premium gives me unlimited questions and video solutions. You can pay by bank transfer, USSD or card here: ${u} — ${firstName}`;

  if (!url) {
    return (
      <Button variant="secondary" block loading={pending} icon={<Share2 className="size-5" />} onClick={() => start(async () => setUrl((await getParentLink()).url))}>
        {pending ? "Creating link…" : "Create a payment link for my parent"}
      </Button>
    );
  }
  return (
    <div className="space-y-3">
      <p className="break-all rounded-[var(--r-md)] border-2 border-dashed border-line bg-paper-2 px-3 py-2 font-mono text-sm">{url}</p>
      <div className="grid grid-cols-2 gap-2">
        <a className={buttonClass({ variant: "primary" })} href={`https://wa.me/?text=${encodeURIComponent(message(url))}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden className="size-5" /> WhatsApp
        </a>
        <Button
          variant="secondary"
          icon={<Copy className="size-5" />}
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
        </Button>
      </div>
      <p className="muted text-xs">The link works for 14 days. Your parent doesn&apos;t need an account.</p>
    </div>
  );
}
