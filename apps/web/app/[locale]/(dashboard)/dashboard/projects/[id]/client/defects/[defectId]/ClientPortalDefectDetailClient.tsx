"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge, Skeleton, EmptyState } from "@/components/ui";
import { blockingBadgeClass, defectStatusBadgeClass } from "../../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

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
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const q = useQuery({
    queryKey: ["project-defect", projectId, defectId],
    queryFn: () => fetchDetail(projectId, defectId),
  });

  if (q.isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton className="h-40" />
      </DashboardGlassCard>
    );
  }

  if (q.isError) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">📌</span>}
          title={tDetail("itemUnavailable")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </DashboardGlassCard>
    );
  }

  const d = q.data!;

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/projects/${projectId}/client/defects`} className="text-aistroyka-accent hover:underline text-sm font-medium">
        {tDetail("backToPunchList")}
      </Link>
      <DashboardGlassCard className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{d.title}</h1>
          <div className="flex flex-wrap gap-2">
            {d.is_blocking ? <Badge className={blockingBadgeClass}>{tDetail("blocking")}</Badge> : null}
            <Badge className={defectStatusBadgeClass(d.status)}>{formatPortalStatus(d.status, "defect", tPortal)}</Badge>
          </div>
        </div>
        {d.description ? <p className="mt-3 text-sm whitespace-pre-wrap">{d.description}</p> : null}
        {d.has_assignee ? <p className="mt-2 text-xs text-aistroyka-text-tertiary">{tDetail("assignedToYourProjectTeam")}</p> : null}
        {d.due_date ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("target")} {new Date(d.due_date).toLocaleDateString()}</p>
        ) : null}
        {d.resolution_note ? (
          <p className="mt-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/40 p-3 text-sm">
            <span className="font-medium">{tDetail("resolution")}:</span> {d.resolution_note}
          </p>
        ) : null}
        {d.resolved_at ? (
          <p className="mt-2 text-xs text-aistroyka-text-tertiary">{tDetail("resolved")} {new Date(d.resolved_at).toLocaleString()}</p>
        ) : null}
      </DashboardGlassCard>
    </div>
  );
}
