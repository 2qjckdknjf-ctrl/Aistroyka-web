"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { pickNextClientMilestone } from "@/lib/domain/client-portal/next-client-milestone";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";
import { ClientPortalCustomerEstimatesSection } from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalCustomerEstimatesSection";
import { ClientPortalRequestsSection } from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalRequestsSection";
import { CanonPageHeader } from "./CanonPageHeader";
import { CanonProgressRing } from "./CanonProgressRing";
import { CanonPortalActivityPanel } from "./CanonPortalActivityPanel";
import { CanonPortalPhotoGallery } from "./CanonPortalPhotoGallery";

export function ClientPortalCanonView({
  data,
  projectId,
}: {
  data: ClientProjectView;
  projectId: string;
}) {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");

  const progressPct =
    data.progress.tasks_total > 0
      ? Math.round((data.progress.tasks_done / data.progress.tasks_total) * 100)
      : 0;
  const nextMilestone = pickNextClientMilestone(data.milestones);
  const approvedBudget = data.customer_estimates
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.total_amount, 0);
  const budgetLabel =
    approvedBudget > 0
      ? `${approvedBudget.toLocaleString()} ${data.customer_estimates[0]?.currency ?? ""}`.trim()
      : t("portalBudgetPending");

  const stageLabel =
    nextMilestone?.title ??
    (data.handover?.status === "handed_over"
      ? tDetail("handoverStatus.handedOver")
      : t("portalStagePending"));

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <Link href="/portal/projects" className="text-sm text-[var(--canon-cyan)] hover:underline">
        {tDetail("backToPortalProjects")}
      </Link>

      <CanonPageHeader title={data.project.name} subtitle={t("screen10Label")} showFavorite={false} />

      <div className="canon-portal-hero canon-glass p-4 sm:p-6">
        <p className="text-xl font-semibold text-[var(--canon-text-primary)]">{t("portalGreeting")}</p>
        <p className="mt-1 text-sm text-[var(--canon-text-secondary)]">{t("portalHeroHint")}</p>
      </div>

      <nav className="canon-glass flex flex-wrap gap-2 p-3" aria-label={t("portalQuickLinks")}>
        <Link
          href={`/dashboard/projects/${projectId}/client/discussions`}
          className="canon-ghost-btn !text-xs"
        >
          {tDetail("discussions")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/client/defects`}
          className="canon-ghost-btn !text-xs"
        >
          {tDetail("punchList")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/client/change-orders`}
          className="canon-ghost-btn !text-xs"
        >
          {tDetail("changeOrders")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/client/service-requests`}
          className="canon-ghost-btn !text-xs"
        >
          {tDetail("aftercareWarranty")}
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/handover/pack`}
          className="canon-ghost-btn !text-xs"
        >
          {tDetail("handoverPackPageTitle")}
        </Link>
      </nav>

      <div className="canon-portal-rings grid gap-4 sm:grid-cols-3">
        <div className="canon-glass flex flex-col items-center gap-2 p-4 text-center">
          <CanonProgressRing value={progressPct} size={96} label={tDetail("progress")} />
          <p className="text-sm font-medium text-[var(--canon-text-primary)]">{t("portalRingProgress")}</p>
          <p className="text-xs text-[var(--canon-text-muted)]">
            {data.progress.tasks_done}/{data.progress.tasks_total} {tDetail("completed")}
          </p>
        </div>
        <div className="canon-glass flex flex-col items-center gap-2 p-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--canon-gold)] bg-[rgba(255,193,7,0.08)] text-lg font-bold text-[var(--canon-gold)]">
            {budgetLabel}
          </div>
          <p className="text-sm font-medium text-[var(--canon-text-primary)]">{t("portalRingBudget")}</p>
        </div>
        <div className="canon-glass flex flex-col items-center gap-2 p-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--canon-cyan)] bg-[rgba(0,212,255,0.08)] px-2 text-center text-xs font-semibold text-[var(--canon-cyan)]">
            {stageLabel}
          </div>
          <p className="text-sm font-medium text-[var(--canon-text-primary)]">{t("portalRingStage")}</p>
        </div>
      </div>

      {data.decisions.length > 0 ? (
        <section id="portal-approvals" className="space-y-3 scroll-mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--canon-gold)]">
            {t("portalAwaitingApproval")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.decisions.map((item) => (
              <div key={item.id} className="canon-glass p-4">
                <p className="font-medium text-[var(--canon-text-primary)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--canon-text-muted)]">{item.type}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="#portal-documents" className="canon-gold-btn !text-xs">
                    {t("portalDetails")}
                  </a>
                  {data.client_requests.some((r) => r.linked_entity_id === item.id) ? (
                    <a href="#portal-client-requests" className="canon-ghost-btn !text-xs">
                      {t("portalApprove")}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.customer_estimates.length > 0 ? (
        <ClientPortalCustomerEstimatesSection
          projectId={projectId}
          estimates={data.customer_estimates}
          canRespond={data.capabilities.can_respond_to_requests}
          surface="canon"
        />
      ) : null}

      {data.client_requests.length > 0 ? (
        <ClientPortalRequestsSection
          projectId={projectId}
          requests={data.client_requests}
          canRespondToRequests={data.capabilities.can_respond_to_requests}
          surface="canon"
        />
      ) : null}

      <div id="portal-documents" className="canon-glass p-4 scroll-mt-4">
        <h3 className="font-semibold text-[var(--canon-text-primary)]">{tDetail("documents")}</h3>
        {data.documents.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--canon-text-muted)]">{tDetail("noDocumentsShared")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.documents.slice(0, 6).map((doc) => (
              <li key={doc.id} className="flex justify-between gap-2 text-sm border-b border-[var(--canon-border-glass)] pb-2">
                <span>{doc.title}</span>
                <span className="text-[var(--canon-text-muted)]">
                  {formatPortalStatus(doc.status, "document", tPortal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CanonPortalPhotoGallery projectId={projectId} />
      <CanonPortalActivityPanel projectId={projectId} />
    </div>
  );
}
