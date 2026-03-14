import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardProjectDetailClient } from "./DashboardProjectDetailClient";

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <DashboardProjectDetailClient projectId={id} />
    </Suspense>
  );
}
