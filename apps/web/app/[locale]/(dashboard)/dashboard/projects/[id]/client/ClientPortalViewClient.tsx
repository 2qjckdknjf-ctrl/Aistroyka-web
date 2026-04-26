"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, SectionHeader, Skeleton, EmptyState, Badge } from "@/components/ui";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { ClientPortalActivitySection } from "./ClientPortalActivitySection";
import { ClientPortalNotificationsSection } from "./ClientPortalNotificationsSection";
import { ClientPortalRequestsSection } from "./ClientPortalRequestsSection";
import { ClientPortalWorkloadSection } from "./ClientPortalWorkloadSection";

async function fetchClientView(projectId: string): Promise<ClientProjectView> {
  const res = await fetch(`/api/v1/projects/${projectId}/client-view`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const json = await res.json();
  return json.data;
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ");
}

export function ClientPortalViewClient({ projectId }: { projectId: string }) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const query = useQuery({
    queryKey: ["client-project-view", projectId],
    queryFn: () => fetchClientView(projectId),
    enabled: !!projectId,
  });

  if (query.isPending) {
    return (
      <Card>
        <Skeleton className="h-40" />
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">🔒</span>}
          title={tDetail("clientPortalUnavailable")}
          subtitle={query.error instanceof Error ? query.error.message : tDetail("youMayNotHaveAccessOrPortalDisabled")}
          action={
            <Link href={`/dashboard/projects/${projectId}`} className="text-aistroyka-accent hover:underline">
              {tDetail("backToProject")}
            </Link>
          }
        />
      </Card>
    );
  }

  const d = query.data!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          {tDetail("backToProjectOverview")}
        </Link>
      </div>
      <SectionHeader title={d.project.name} subtitle={tPage("clientViewSubtitle")} />

      <ClientPortalNotificationsSection projectId={projectId} />

      <ClientPortalWorkloadSection projectId={projectId} />

      <ClientPortalRequestsSection
        projectId={projectId}
        requests={d.client_requests}
        canRespondToRequests={d.capabilities.can_respond_to_requests}
      />

      <ClientPortalActivitySection projectId={projectId} />

      <Card className="p-4 border-l-4 border-l-aistroyka-info">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("discussions")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("discussionsHint")}
        </p>
        <Link
          href={`/dashboard/projects/${projectId}/client/discussions`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("openDiscussions")}
        </Link>
      </Card>

      <Card className="p-4 border-l-4 border-l-aistroyka-error">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("punchList")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("punchListHint")}
        </p>
        <Link
          href={`/dashboard/projects/${projectId}/client/defects`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("viewPunchList")}
        </Link>
      </Card>

      <Card className="p-4 border-l-4 border-l-aistroyka-success">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("aftercareWarranty")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("aftercareWarrantyHint")}
        </p>
        <Link
          href={`/dashboard/projects/${projectId}/client/service-requests`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("openAftercare")}
        </Link>
      </Card>

      <Card className="p-4 border-l-4 border-l-aistroyka-warning">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("changeOrders")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("changeOrdersHint")}
        </p>
        <Link
          href={`/dashboard/projects/${projectId}/client/change-orders`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("viewChangeOrders")}
        </Link>
      </Card>

      {d.handover ? (
        <Card className="p-4 border-l-4 border-l-aistroyka-success">
          <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("handoverCompletion")}</h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            {d.handover.status === "in_progress" && tDetail("handoverStatus.inProgress")}
            {d.handover.status === "handover_ready" && tDetail("handoverStatus.ready")}
            {d.handover.status === "handed_over" && tDetail("handoverStatus.handedOver")}
            {d.handover.status === "completed" && tDetail("handoverStatus.completed")}
          </p>
          {d.handover.handover_notes ? (
            <p className="mt-3 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/40 p-3 text-sm whitespace-pre-wrap">
              {d.handover.handover_notes}
            </p>
          ) : null}
          {(d.handover.handed_over_at || d.handover.completed_at) && (
            <p className="mt-2 text-xs text-aistroyka-text-tertiary">
              {d.handover.handed_over_at
                ? `Handover recorded ${new Date(d.handover.handed_over_at).toLocaleString()}`
                : null}
              {d.handover.completed_at
                ? ` · Completed ${new Date(d.handover.completed_at).toLocaleString()}`
                : null}
            </p>
          )}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4 border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase text-aistroyka-text-tertiary">{tDetail("tasks")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold">
            {d.progress.tasks_done} / {d.progress.tasks_total} {tDetail("completed")}
          </p>
        </Card>
        {d.budget && (
          <Card className="p-4 border-l-4 border-l-aistroyka-success">
            <p className="text-aistroyka-caption font-medium uppercase text-aistroyka-text-tertiary">{tDetail("budgetSummary")}</p>
            <p className="mt-1 text-aistroyka-title3 font-semibold">
              {d.budget.actual_total.toLocaleString()} / {d.budget.planned_total.toLocaleString()} {d.budget.currency}
            </p>
            {d.budget.over_budget ? (
              <p className="mt-1 text-sm text-aistroyka-error">{tDetail("overPlannedTotal")}</p>
            ) : (
              <p className="mt-1 text-sm text-aistroyka-text-tertiary">{tDetail("withinPlannedTotal")}</p>
            )}
          </Card>
        )}
      </div>

      {d.decisions.length > 0 && (
        <Card className="p-4 border-l-4 border-l-aistroyka-warning">
          <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("actionNeeded")}</h3>
          <ul className="mt-2 space-y-2">
            {d.decisions.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">
                  {x.kind === "changes_requested" ? "Update requested" : "Review"}
                </Badge>
                <span className="text-aistroyka-text-primary">{x.title}</span>
                <span className="text-aistroyka-text-tertiary">({x.type})</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-aistroyka-text-tertiary">
            Use the owner decision flow from your team — this list shows items that need your attention.
          </p>
          <Link href={`/dashboard/projects/${projectId}/owner`} className="mt-2 inline-block text-sm text-aistroyka-accent hover:underline">
            Open owner workspace →
          </Link>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("milestones")}</h3>
        {d.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("noMilestonesShared")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {d.milestones.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-aistroyka-border-subtle pb-2">
                <span className="font-medium text-aistroyka-text-primary">{m.title}</span>
                <span className="text-aistroyka-text-secondary">
                  {new Date(m.target_date).toLocaleDateString()} · {statusLabel(m.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("documents")}</h3>
        {d.documents.length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("noDocumentsShared")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {d.documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-aistroyka-border-subtle pb-2">
                <span className="font-medium text-aistroyka-text-primary">{doc.title}</span>
                <span className="text-aistroyka-text-secondary capitalize">
                  {doc.type} · {statusLabel(doc.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
