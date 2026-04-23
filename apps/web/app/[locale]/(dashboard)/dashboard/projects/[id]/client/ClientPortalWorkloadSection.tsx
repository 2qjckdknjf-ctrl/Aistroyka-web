"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton } from "@/components/ui";
import type { WorkloadInboxResult, WorkloadItem } from "@/lib/domain/workload/workload.types";

async function fetchStakeholderWorkload(): Promise<WorkloadInboxResult> {
  const res = await fetch("/api/v1/workload?audience=stakeholder", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

function priBadge(p: string) {
  if (p === "urgent") return <Badge className="bg-aistroyka-error/20 text-aistroyka-error">Urgent</Badge>;
  if (p === "high") return <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">High</Badge>;
  return <Badge className="text-aistroyka-text-tertiary">Normal</Badge>;
}

export function ClientPortalWorkloadSection({ projectId }: { projectId: string }) {
  const q = useQuery({
    queryKey: ["workload", "stakeholder", projectId],
    queryFn: fetchStakeholderWorkload,
  });

  const items = (q.data?.items ?? []).filter((i: WorkloadItem) => i.project_id === projectId);

  if (q.isPending) {
    return (
      <Card className="p-4 border-l-4 border-l-aistroyka-info">
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (q.isError) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border-l-4 border-l-aistroyka-info">
      <h3 className="font-semibold text-aistroyka-text-primary">Waiting on you</h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">
        Items that need your response on this project — not a generic task list.
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((w) => (
          <li key={w.id} className="rounded border border-aistroyka-border-subtle p-3">
            <div className="flex flex-wrap items-center gap-2">
              {priBadge(w.priority)}
              <span className="font-medium text-aistroyka-text-primary">{w.title}</span>
            </div>
            <p className="mt-1 text-sm text-aistroyka-text-secondary">{w.reason}</p>
            <Link href={w.action_url} className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline">
              Take action →
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
