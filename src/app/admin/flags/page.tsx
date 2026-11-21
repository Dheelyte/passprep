import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { setFlagStatus } from "@/app/actions/admin";
import { PageHeader, SkeletonList } from "@/components/admin-ui";

export default function FlagsPage() {
  return (
    <>
      <PageHeader title="Student reports" subtitle="Questions students think are wrong or unclear." />
      <Suspense fallback={<SkeletonList rows={5} />}>
        <Flags />
      </Suspense>
    </>
  );
}

async function Flags() {
  await requireRole("TEACHER", "ADMIN");
  const flags = await db.flag.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { question: { select: { id: true, stem: true, topic: { select: { name: true } } } }, user: { select: { name: true } } },
  });
  if (flags.length === 0) return <p className="card muted">No open reports.</p>;
  return (
    <ul className="space-y-3">
      {flags.map((f) => (
        <li key={f.id} className="card flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="muted text-xs">{f.createdAt.toLocaleString("en-NG")} · {f.question.topic.name} · from {f.user.name}</p>
            <p className="my-1 font-medium">“{f.reason}”</p>
            <Link href={`/admin/questions/${f.question.id}`} className="line-clamp-2 text-sm text-info underline">{f.question.stem}</Link>
          </div>
          <form action={setFlagStatus} className="flex gap-2">
            <input type="hidden" name="id" value={f.id} />
            <button name="status" value="DISMISSED" className="btn-secondary min-h-10 text-sm">Dismiss</button>
            <button name="status" value="RESOLVED" className="btn-primary min-h-10 text-sm">Fixed</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
