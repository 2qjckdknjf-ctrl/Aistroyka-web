import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ManagerDiscussionDetailClient } from "./ManagerDiscussionDetailClient";

export default async function ManagerDiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string; discussionId: string }>;
}) {
  const { id, discussionId } = await params;
  if (!id || !discussionId) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ManagerDiscussionDetailClient projectId={id} discussionId={discussionId} />
    </Suspense>
  );
}
