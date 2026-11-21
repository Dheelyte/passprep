import { PublicShell } from "@/components/public-shell";
import { ButtonLink, EmptyState } from "@/components/ds";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="pt-6">
        <p className="num mb-2 text-center text-8xl" aria-hidden>404</p>
        <EmptyState
          kind="lost"
          title="This page don waka"
          body="We searched every exercise book. This page isn't here — maybe the link is old."
          action={<ButtonLink href="/dashboard">Back to practice</ButtonLink>}
        />
      </div>
    </PublicShell>
  );
}
