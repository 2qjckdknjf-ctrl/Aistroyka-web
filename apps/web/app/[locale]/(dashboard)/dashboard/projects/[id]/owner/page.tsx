import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OwnerViewClient } from "../OwnerViewClient";

export default async function OwnerViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <OwnerViewClient projectId={id} />
    </Suspense>
  );
}
