import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientPortalServiceRequestDetailClient } from "./ClientPortalServiceRequestDetailClient";

export default async function ClientPortalServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  if (!id || !requestId) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalServiceRequestDetailClient projectId={id} requestId={requestId} />
    </Suspense>
  );
}
