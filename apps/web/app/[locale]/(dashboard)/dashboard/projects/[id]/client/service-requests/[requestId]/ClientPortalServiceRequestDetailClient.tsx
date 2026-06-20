"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Badge, Skeleton, EmptyState } from "@/components/ui";
import { serviceRequestStatusBadgeClass } from "../../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";

type PublicDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  coverage_type: string;
  due_date: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  linked_defect_id: string | null;
  linked_discussion_id: string | null;
};

function coverageLabel(c: string, tDetail: ReturnType<typeof useTranslations>): string {
  if (c === "warranty_covered") return tDetail("treatedAsWarrantyCovered");
  if (c === "not_warranty") return tDetail("notUnderWarranty");
  return tDetail("warrantyCoverageUnderReview");
}

async function fetchDetail(projectId: string, requestId: string): Promise<PublicDetail> {
  const res = await fetch(`/api/v1/projects/${projectId}/service-requests/${requestId}`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function ClientPortalServiceRequestDetailClient({
  projectId,
  requestId,
}: {
  projectId: string;
  requestId: string;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const q = useQuery({
    queryKey: ["project-service-request", projectId, requestId, "portal"],
    queryFn: () => fetchDetail(projectId, requestId),
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
          icon={<span className="text-2xl">🛠️</span>}
          title={tDetail("requestUnavailable")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const d = q.data!;

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/projects/${projectId}/client/service-requests`}
        className="text-aistroyka-accent hover:underline text-sm font-medium"
      >
        {tDetail("backToAftercare")}
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{d.title}</h1>
          <Badge className={serviceRequestStatusBadgeClass(d.status)}>{formatPortalStatus(d.status, "serviceRequest", tPortal)}</Badge>
        </div>
        <p className="mt-2 text-sm text-aistroyka-text-secondary">{coverageLabel(d.coverage_type, tDetail)}</p>
        {d.description ? <p className="mt-3 text-sm whitespace-pre-wrap">{d.description}</p> : null}
        {d.due_date ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("targetDate")} {new Date(d.due_date).toLocaleDateString()}</p>
        ) : null}
        {d.linked_defect_id ? (
          <p className="mt-3 text-sm">
            <Link
              href={`/dashboard/projects/${projectId}/client/defects/${d.linked_defect_id}`}
              className="text-aistroyka-accent hover:underline"
            >
              {tDetail("relatedPunchListItem")}
            </Link>
          </p>
        ) : null}
        {d.linked_discussion_id ? (
          <p className="mt-2 text-sm">
            <Link
              href={`/dashboard/projects/${projectId}/client/discussions/${d.linked_discussion_id}`}
              className="text-aistroyka-accent hover:underline"
            >
              {tDetail("relatedDiscussion")}
            </Link>
          </p>
        ) : null}
        {d.resolution_note ? (
          <p className="mt-4 surface-glass-muted rounded p-3 text-sm">
            <span className="font-medium">{tDetail("outcome")}:</span> {d.resolution_note}
          </p>
        ) : null}
        {d.resolved_at ? (
          <p className="mt-2 text-xs text-aistroyka-text-tertiary">{tDetail("updated")} {new Date(d.resolved_at).toLocaleString()}</p>
        ) : null}
      </Card>
    </div>
  );
}
