"use client";
import { useState, useTransition } from "react";
import { cancelAutoRenew } from "@/app/actions/billing";
import { Button } from "./ds/button";
import { Sheet } from "./ds/sheet";

export function CancelRenewal() {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (msg) return <p role="status" className="text-sm font-semibold">{msg}</p>;
  return (
    <>
      <Button variant="secondary" block onClick={() => setOpen(true)}>Cancel automatic renewal</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Cancel renewal?">
        <p className="mb-4">You keep Premium until the end of the period you&apos;ve paid for. After that you go back to the free plan, and your streak, points and progress stay.</p>
        <div className="grid gap-2">
          <Button variant="secondary" block onClick={() => setOpen(false)}>Keep Premium</Button>
          <Button
            variant="danger"
            block
            loading={pending}
            onClick={() =>
              start(async () => {
                setMsg((await cancelAutoRenew()).message);
                setOpen(false);
              })
            }
          >
            Yes, cancel renewal
          </Button>
        </div>
      </Sheet>
    </>
  );
}
