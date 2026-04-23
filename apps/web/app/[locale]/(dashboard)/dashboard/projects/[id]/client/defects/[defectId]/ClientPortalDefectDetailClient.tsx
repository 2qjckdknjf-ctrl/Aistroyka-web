"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, EmptyState } from "@/components/ui";
import { blockingBadgeClass, defectStatusBadgeClass, formatStatusLabel } from "../../../statusBadgeStyles";

type PublicDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_blocking: boolean;
  due_date: string | null;
  has_assignee: boolean;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

async function fetchDetail(projectId: string, defectId: string): Promise<PublicDetail> {
  const res = await fetch(`/api/v1/projects/${projectId}/defects/${defectId}`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function ClientPortalDefectDetailClient({ projectId, defectId }: { projectId: string; defectId: string }) {
  const q = useQuery({
    queryKey: ["project-defect", projectId, defectId],
    queryFn: () => fetchDetail(projectId, defectId),
  });

  if (q.isPending) {
    return (
      <Card>
        <Skeleton className="h-40" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📌</span>}
          title="Item unavailable"
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const d = q.data!;

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/projects/${projectId}/client/defects`} className="text-aistroyka-accent hover:underline text-sm font-medium">
        ← Punch list
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{d.title}</h1>
          <div className="flex flex-wrap gap-2">
            {d.is_blocking ? <Badge className={blockingBadgeClass}>Blocking</Badge> : null}
            <Badge className={defectStatusBadgeClass(d.status)}>{formatStatusLabel(d.status)}</Badge>
          </div>
        </div>
        {d.description ? <p className="mt-3 text-sm whitespace-pre-wrap">{d.description}</p> : null}
        {d.has_assignee ? <p className="mt-2 text-xs text-aistroyka-text-tertiary">Assigned to your project team.</p> : null}
        {d.due_date ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">Target: {new Date(d.due_date).toLocaleDateString()}</p>
        ) : null}
        {d.resolution_note ? (
          <p className="mt-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/40 p-3 text-sm">
            <span className="font-medium">Resolution:</span> {d.resolution_note}
          </p>
        ) : null}
        {d.resolved_at ? (
          <p className="mt-2 text-xs text-aistroyka-text-tertiary">Resolved {new Date(d.resolved_at).toLocaleString()}</p>
        ) : null}
      </Card>
    </div>
  );
}
