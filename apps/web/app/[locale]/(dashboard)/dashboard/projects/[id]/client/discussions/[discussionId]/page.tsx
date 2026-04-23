import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClientPortalDiscussionDetailClient } from "./ClientPortalDiscussionDetailClient";

export default async function ClientPortalDiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string; discussionId: string }>;
}) {
  const { id, discussionId } = await params;
  if (!id || !discussionId) notFound();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalDiscussionDetailClient projectId={id} discussionId={discussionId} />
    </Suspense>
  );
}
