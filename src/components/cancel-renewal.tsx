"use client";
import { useState, useTransition } from "react";
import { cancelAutoRenew } from "@/app/actions/billing";

export function CancelRenewal() {
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  if (msg) return <p role="status" className="text-sm">{msg}</p>;
  if (!confirming)
    return (
      <button type="button" className="btn-secondary w-full" onClick={() => setConfirming(true)}>
        Cancel automatic renewal
      </button>
    );
  return (
    <div className="space-y-2">
      <p className="text-sm">You&apos;ll keep Premium until the end of this period. Cancel renewal?</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>Keep it</button>
        <button type="button" className="btn bg-bad text-white" disabled={pending} onClick={() => start(async () => setMsg((await cancelAutoRenew()).message))}>
          {pending ? "Cancelling…" : "Yes, cancel"}
        </button>
      </div>
    </div>
  );
}
