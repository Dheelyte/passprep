"use client";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

/** Submit button that shows the loading state while its parent <form> action is pending. */
export function SubmitButton({ pendingLabel, children, ...rest }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
