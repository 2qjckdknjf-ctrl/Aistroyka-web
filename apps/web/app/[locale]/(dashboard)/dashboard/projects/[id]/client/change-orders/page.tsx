import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientPortalChangeOrdersListClient } from "./ClientPortalChangeOrdersListClient";

export default async function ClientPortalChangeOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalChangeOrdersListClient projectId={id} />
    </Suspense>
  );
}
