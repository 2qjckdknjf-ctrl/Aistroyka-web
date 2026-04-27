import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientPortalViewClient } from "./ClientPortalViewClient";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalViewClient projectId={id} />
    </Suspense>
  );
}
