import { PublicShell } from "@/components/public-shell";
import { ButtonLink, EmptyState } from "@/components/ds";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="pt-6">
        <p className="num mb-4 text-center text-8xl" aria-hidden><span className="text-primary">4</span><span className="text-coral">0</span><span className="text-sun [-webkit-text-stroke:2px_var(--line)]">4</span></p>
        <EmptyState
          kind="lost"
          title="This page don waka"
          body="We searched every exercise book. This page isn't here. Maybe the link is old."
          action={<ButtonLink href="/dashboard">Back to practice</ButtonLink>}
        />
      </div>
    </PublicShell>
  );
}
