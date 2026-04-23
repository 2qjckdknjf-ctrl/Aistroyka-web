import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientPortalDefectsListClient } from "./ClientPortalDefectsListClient";

export default async function ClientPortalDefectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalDefectsListClient projectId={id} />
    </Suspense>
  );
}
