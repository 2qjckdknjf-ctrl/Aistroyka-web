import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientPortalServiceRequestsListClient } from "./ClientPortalServiceRequestsListClient";

export default async function ClientPortalServiceRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalServiceRequestsListClient projectId={id} />
    </Suspense>
  );
}
