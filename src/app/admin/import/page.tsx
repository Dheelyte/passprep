import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { ImportForm } from "@/components/import-form";
import { PageHeader, SkeletonList } from "@/components/ui";

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Bulk import" subtitle="Upload a spreadsheet, check the preview, then import. Imported questions go to the review queue." />
      <Suspense fallback={<SkeletonList rows={2} />}>
        <Gate />
      </Suspense>
    </>
  );
}

async function Gate() {
  const user = await requireRole("TEACHER", "ADMIN");
  return <ImportForm canEditSyllabus={user.role === "ADMIN"} />;
}
