import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ManagerChangeOrderDetailClient } from "./ManagerChangeOrderDetailClient";

export default async function ManagerChangeOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; changeOrderId: string }>;
}) {
  const { id, changeOrderId } = await params;
  if (!id || !changeOrderId) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ManagerChangeOrderDetailClient projectId={id} changeOrderId={changeOrderId} />
    </Suspense>
  );
}
