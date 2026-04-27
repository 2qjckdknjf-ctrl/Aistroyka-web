import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ManagerServiceRequestDetailClient } from "./ManagerServiceRequestDetailClient";

export default async function ManagerServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  if (!id || !requestId) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ManagerServiceRequestDetailClient projectId={id} requestId={requestId} />
    </Suspense>
  );
}
