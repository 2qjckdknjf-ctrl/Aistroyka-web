import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ManagerDefectDetailClient } from "./ManagerDefectDetailClient";

export default async function ManagerDefectDetailPage({
  params,
}: {
  params: Promise<{ id: string; defectId: string }>;
}) {
  const { id, defectId } = await params;
  if (!id || !defectId) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ManagerDefectDetailClient projectId={id} defectId={defectId} />
    </Suspense>
  );
}
