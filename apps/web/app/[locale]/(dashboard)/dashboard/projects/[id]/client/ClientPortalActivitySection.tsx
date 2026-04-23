"use client";

import { useQuery } from "@tanstack/react-query";
import { StakeholderActivityBlock } from "@/components/projects/StakeholderActivityBlock";

async function fetchPortalActivity(projectId: string) {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-activity?limit=35`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function ClientPortalActivitySection({ projectId }: { projectId: string }) {
  const q = useQuery({
    queryKey: ["stakeholder-activity", projectId, "portal"],
    queryFn: () => fetchPortalActivity(projectId),
    enabled: !!projectId,
  });

  if (q.isPending) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4">
        <p className="text-sm text-aistroyka-text-tertiary">Loading activity…</p>
      </div>
    );
  }

  if (q.isError) {
    return null;
  }

  return (
    <StakeholderActivityBlock
      items={q.data ?? []}
      title="Activity"
      emptyMessage="No activity to show yet."
      maxItems={25}
    />
  );
}
