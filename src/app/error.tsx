"use client";

import { useEffect, useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink, ErrorState } from "@/components/ds";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <ErrorState
        offline={!online}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => retry()} icon={<RotateCcw className="size-5" />}>Try again</Button>
            <ButtonLink href="/dashboard" variant="secondary">Go home</ButtonLink>
          </div>
        }
      />
    </div>
  );
}
