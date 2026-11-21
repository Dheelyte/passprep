import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, SkeletonList } from "@/components/admin-ui";

export default function AdminHome() {
  return (
    <>
      <PageHeader title="Content overview" subtitle="Every question needs a second teacher's review before students see it." />
      <Suspense fallback={<SkeletonList rows={3} />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const user = await requireRole("TEACHER", "ADMIN");
  const [byStatus, flags, subjects, waitingForMe, batches] = await Promise.all([
    db.question.groupBy({ by: ["status"], _count: true }),
    db.flag.count({ where: { status: "OPEN" } }),
    db.subject.findMany({ orderBy: { order: "asc" }, include: { topics: { select: { id: true, _count: { select: { questions: { where: { status: "PUBLISHED" } } } } } } } }),
    db.question.count({ where: { status: "IN_REVIEW", NOT: { authorId: user.id } } }),
    db.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { uploader: { select: { name: true } } } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const tiles = [
    { label: "Published", value: count("PUBLISHED"), href: "/admin/questions?status=PUBLISHED" },
    { label: "Waiting for your review", value: waitingForMe, href: "/admin/review" },
    { label: "Rejected", value: count("REJECTED"), href: "/admin/questions?status=REJECTED" },
    { label: "Open student flags", value: flags, href: "/admin/flags" },
  ];
  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="card block hover:border-brand">
              <span className="block text-3xl font-bold">{t.value}</span>
              <span className="muted text-sm">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="card">
        <h2 className="mb-2 font-semibold">Published questions by subject</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-ink-2"><tr><th className="py-1">Subject</th><th>Topics</th><th>Topics with no questions</th><th>Questions</th></tr></thead>
          <tbody>
            {subjects.map((s) => {
              const n = s.topics.reduce((a, t) => a + t._count.questions, 0);
              const empty = s.topics.filter((t) => t._count.questions === 0).length;
              return (
                <tr key={s.id} className="border-t border-rule">
                  <td className="py-2 font-medium">{s.name}</td><td>{s.topics.length}</td><td>{empty}</td><td className="font-semibold">{n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2 className="mb-2 font-semibold">Recent imports</h2>
        {batches.length === 0 ? <p className="muted text-sm">No imports yet.</p> : (
          <ul className="space-y-1 text-sm">
            {batches.map((b) => (
              <li key={b.id}>{b.createdAt.toLocaleString("en-NG")} · {b.kind} · <strong>{b.filename}</strong> · {b.created}/{b.rowCount} rows · {b.uploader.name}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
