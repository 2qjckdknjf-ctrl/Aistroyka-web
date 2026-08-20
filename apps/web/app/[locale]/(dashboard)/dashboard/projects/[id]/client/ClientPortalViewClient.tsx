"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionHeader, Skeleton, EmptyState, Badge } from "@/components/ui";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { pickNextClientMilestone } from "@/lib/domain/client-portal/next-client-milestone";
import { translateApiError } from "@/lib/i18n/api-error-messages";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { ClientPortalActivitySection } from "./ClientPortalActivitySection";
import { ClientPortalNotificationsSection } from "./ClientPortalNotificationsSection";
import { ClientPortalRequestsSection } from "./ClientPortalRequestsSection";
import { ClientPortalCustomerEstimatesSection } from "./ClientPortalCustomerEstimatesSection";
import { ClientPortalWorkloadSection } from "./ClientPortalWorkloadSection";
import { TelegramConnectCard } from "@/components/integrations/TelegramConnectCard";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { usePortalOnlyShell } from "@/components/DashboardShell";

async function fetchClientView(projectId: string, tErr: (k: string) => string): Promise<ClientProjectView> {
  const res = await fetch(`/api/v1/projects/${projectId}/client-view`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(translateApiError((j as { error?: string }).error, tErr));
  }
  const json = await res.json();
  return json.data;
}

function documentTypeLabel(type: string, tDetail: (key: string) => string): string {
  switch (type) {
    case "act":
      return tDetail("act");
    case "contract":
      return tDetail("contract");
    default:
      return tDetail("document");
  }
}

export function ClientPortalViewClient({ projectId }: { projectId: string }) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const tApi = useTranslations("apiErrors");
  const portalOnly = usePortalOnlyShell();
  const query = useQuery({
    queryKey: ["client-project-view", projectId],
    queryFn: () => fetchClientView(projectId, tApi),
    enabled: !!projectId,
  });

  const backHref = portalOnly ? "/portal/projects" : `/dashboard/projects/${projectId}`;
  const backLabel = portalOnly ? tDetail("backToPortalProjects") : tDetail("backToProjectOverview");

  if (query.isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton className="h-40" />
      </DashboardGlassCard>
    );
  }

  if (query.isError) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">🔒</span>}
          title={tDetail("clientPortalUnavailable")}
          subtitle={query.error instanceof Error ? query.error.message : tDetail("youMayNotHaveAccessOrPortalDisabled")}
          action={
            <Link href={backHref} className="text-aistroyka-accent hover:underline">
              {portalOnly ? tDetail("backToPortalProjects") : tDetail("backToProject")}
            </Link>
          }
        />
      </DashboardGlassCard>
    );
  }

  const d = query.data!;
  const nextMilestone = pickNextClientMilestone(d.milestones);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={backHref} className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
          {backLabel}
        </Link>
      </div>
      <SectionHeader title={d.project.name} subtitle={tPage("clientViewSubtitle")} />

      {d.decisions.length > 0 ? (
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-warning">
          <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("actionNeeded")}</h3>
          <ul className="mt-2 space-y-2">
            {d.decisions.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">
                  {x.kind === "changes_requested" ? tDetail("updateRequested") : tDetail("review")}
                </Badge>
                <span className="text-aistroyka-text-primary">{x.title}</span>
                <span className="text-aistroyka-text-tertiary">({x.type})</span>
              </li>
            ))}
          </ul>
          {portalOnly ? null : (
            <p className="mt-3 text-xs text-aistroyka-text-tertiary">{tDetail("ownerDecisionFlowHint")}</p>
          )}
        </DashboardGlassCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase text-aistroyka-text-tertiary">{tDetail("progress")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold">
            {d.progress.tasks_done} / {d.progress.tasks_total} {tDetail("completed")}
          </p>
        </DashboardGlassCard>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase text-aistroyka-text-tertiary">{tDetail("nextMilestone")}</p>
          {nextMilestone ? (
            <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
              {nextMilestone.title}
              <span className="mt-1 block text-aistroyka-subheadline font-normal text-aistroyka-text-secondary">
                {new Date(nextMilestone.target_date).toLocaleDateString()} ·{" "}
                {formatPortalStatus(nextMilestone.status, "milestone", tPortal)}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("noUpcomingMilestone")}</p>
          )}
        </DashboardGlassCard>
      </div>

      <DashboardGlassCard>
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("documents")}</h3>
        {d.documents.length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("noDocumentsShared")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {d.documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-aistroyka-border-subtle pb-2">
                <span className="font-medium text-aistroyka-text-primary">{doc.title}</span>
                <span className="text-aistroyka-text-secondary">
                  {documentTypeLabel(doc.type, tDetail)} · {formatPortalStatus(doc.status, "document", tPortal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardGlassCard>

      <ClientPortalNotificationsSection projectId={projectId} />

      <DashboardGlassCard>
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("milestones")}</h3>
        {d.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-aistroyka-text-secondary">{tDetail("noMilestonesShared")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {d.milestones.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-aistroyka-border-subtle pb-2">
                <span className="font-medium text-aistroyka-text-primary">{m.title}</span>
                <span className="text-aistroyka-text-secondary">
                  {new Date(m.target_date).toLocaleDateString()} · {formatPortalStatus(m.status, "milestone", tPortal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardGlassCard>

      <ClientPortalCustomerEstimatesSection
        projectId={projectId}
        estimates={d.customer_estimates}
        canRespond={d.capabilities.can_respond_to_requests}
      />

      <ClientPortalRequestsSection
        projectId={projectId}
        requests={d.client_requests}
        canRespondToRequests={d.capabilities.can_respond_to_requests}
      />

      <DashboardGlassCard className="border-l-4 border-l-aistroyka-info">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("discussions")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{tDetail("discussionsHint")}</p>
        <Link
          href={`/dashboard/projects/${projectId}/client/discussions`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("openDiscussions")}
        </Link>
      </DashboardGlassCard>

      <DashboardGlassCard className="border-l-4 border-l-aistroyka-error">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("punchList")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{tDetail("punchListHint")}</p>
        <Link
          href={`/dashboard/projects/${projectId}/client/defects`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("viewPunchList")}
        </Link>
      </DashboardGlassCard>

      <DashboardGlassCard className="border-l-4 border-l-aistroyka-success">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("aftercareWarranty")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{tDetail("aftercareWarrantyHint")}</p>
        <Link
          href={`/dashboard/projects/${projectId}/client/service-requests`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("openAftercare")}
        </Link>
      </DashboardGlassCard>

      <DashboardGlassCard className="border-l-4 border-l-aistroyka-warning">
        <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("changeOrders")}</h3>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{tDetail("changeOrdersHint")}</p>
        <Link
          href={`/dashboard/projects/${projectId}/client/change-orders`}
          className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("viewChangeOrders")}
        </Link>
      </DashboardGlassCard>

      {d.handover ? (
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-success">
          <h3 className="font-semibold text-aistroyka-text-primary">{tDetail("handoverCompletion")}</h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            {d.handover.status === "in_progress"
              ? tDetail("handoverStatus.inProgress")
              : d.handover.status === "handover_ready"
                ? tDetail("handoverStatus.ready")
                : d.handover.status === "handed_over"
                  ? tDetail("handoverStatus.handedOver")
                  : tDetail("handoverStatus.completed")}
          </p>
          {d.handover.handover_notes ? (
            <p className="mt-3 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/40 p-3 text-sm whitespace-pre-wrap">
              {d.handover.handover_notes}
            </p>
          ) : null}
          {(d.handover.handed_over_at || d.handover.completed_at) && (
            <p className="mt-2 text-xs text-aistroyka-text-tertiary">
              {d.handover.handed_over_at
                ? tDetail("handoverRecordedAt", {
                    datetime: new Date(d.handover.handed_over_at).toLocaleString(),
                  })
                : null}
              {d.handover.handed_over_at && d.handover.completed_at ? ` ${tDetail("dotSeparator")} ` : null}
              {d.handover.completed_at
                ? tDetail("completedAt", {
                    datetime: new Date(d.handover.completed_at).toLocaleString(),
                  })
                : null}
            </p>
          )}
          {portalOnly ? null : (
            <Link
              href={`/dashboard/projects/${projectId}/handover/pack`}
              className="mt-3 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
            >
              {tDetail("handoverPackPreviewLink")}
            </Link>
          )}
        </DashboardGlassCard>
      ) : null}

      <ClientPortalWorkloadSection projectId={projectId} />
      {portalOnly ? null : <TelegramConnectCard />}
      <ClientPortalActivitySection projectId={projectId} />
    </div>
  );
}
