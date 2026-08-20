"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getResourceHref } from "@/lib/intelligence/resource-links";
import {
  ProjectHealthPanel,
  RiskList,
  IntelligenceCard,
  EvidenceCoverageCard,
  ReportingDisciplineCard,
  SummaryCard,
  RecommendationList,
  CopilotSummaryPanel,
  ManagerActionView,
  IntelligenceOperationalBanner,
  type ProjectIntelligenceData,
} from "@/components/intelligence";
import { Skeleton, ErrorState } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

class IntelligenceFetchError extends Error {
  status: number;
  requestId: string | null;
  constructor(message: string, status: number, requestId: string | null) {
    super(message);
    this.name = "IntelligenceFetchError";
    this.status = status;
    this.requestId = requestId;
  }
}

async function fetchIntelligence(projectId: string): Promise<ProjectIntelligenceData> {
  const res = await fetch(`/api/v1/projects/${projectId}/intelligence`, {
    credentials: "include",
  });
  const requestId = res.headers.get("x-request-id");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new IntelligenceFetchError(
      typeof err.error === "string" ? err.error : "Failed to load intelligence",
      res.status,
      requestId
    );
  }
  const json = await res.json();
  return json.data;
}

function intelligenceErrorMessage(err: unknown): { title: string; hint: string; ref: string | null } {
  if (err instanceof IntelligenceFetchError) {
    if (err.status === 401) {
      return {
        title: "Session required",
        hint: "Sign in again to view project intelligence.",
        ref: err.requestId,
      };
    }
    if (err.status === 403) {
      return {
        title: "No access",
        hint: "You don't have permission to view intelligence for this project (tenant or role).",
        ref: err.requestId,
      };
    }
    if (err.status === 503) {
      return {
        title: "Intelligence temporarily unavailable",
        hint: "Computation or upstream data failed — this is usually a product/runtime issue, not missing project data. Retry shortly; contact admin if it persists.",
        ref: err.requestId,
      };
    }
    return {
      title: err.message,
      hint: "If this persists, share the reference ID with your administrator.",
      ref: err.requestId,
    };
  }
  return {
    title: err instanceof Error ? err.message : "Intelligence unavailable",
    hint: "Try again. Contact support if the problem continues.",
    ref: null,
  };
}

export function ProjectIntelligenceClient({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["project-intelligence", projectId],
    queryFn: () => fetchIntelligence(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  if (isError) {
    const { title, hint, ref } = intelligenceErrorMessage(error);
    return (
      <section className="space-y-4" aria-label={tDetail("intelligenceError")}>
        <ErrorState message={title} onRetry={() => refetch()} />
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-info bg-aistroyka-surface-raised">
          <p className="text-sm text-aistroyka-text-secondary">{hint}</p>
          {ref && (
            <p className="mt-2 text-xs font-mono text-aistroyka-text-tertiary">
              {tDetail("referenceForAdmin")}: {ref}
            </p>
          )}
        </DashboardGlassCard>
      </section>
    );
  }

  if (isPending || !data) {
    return (
      <section className="space-y-4" aria-label={tDetail("intelligenceLoading")}>
        <DashboardGlassCard>
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </DashboardGlassCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardGlassCard>
            <Skeleton className="h-24" />
          </DashboardGlassCard>
          <DashboardGlassCard>
            <Skeleton className="h-24" />
          </DashboardGlassCard>
        </div>
      </section>
    );
  }

  const {
    health,
    insights,
    riskOverview,
    evidenceCoverage,
    reportingDiscipline,
    executiveSummary,
    recommendations,
    projectHealthScore,
    executiveProjectSummary,
    missingEvidenceInsights,
    topRiskInsights,
    operational,
  } = data;

  const healthToShow = projectHealthScore ?? health;
  const summaryToShow = executiveProjectSummary ?? executiveSummary;

  return (
    <section className="space-y-6" aria-label={tDetail("projectIntelligence")}>
      {operational && <IntelligenceOperationalBanner operational={operational} />}
      <ManagerActionView data={data} projectId={projectId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectHealthPanel health={healthToShow} emptyMessage={tDetail("noHealthDataYet")} />
        {summaryToShow && <SummaryCard summary={summaryToShow} />}
        {!summaryToShow && (
          <IntelligenceCard title={tDetail("executiveSummary")}>
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
              {tDetail("noSummaryAddTasksReports")}
            </p>
          </IntelligenceCard>
        )}
        <IntelligenceCard title={tDetail("riskRadar")} aria-label={tDetail("riskOverview")}>
          <div className="flex flex-wrap gap-2 text-aistroyka-caption">
            <span className="font-medium text-aistroyka-error">{tDetail("highLabel")} {riskOverview.high}</span>
            <span className="font-medium text-aistroyka-warning">{tDetail("mediumLabel")} {riskOverview.medium}</span>
            <span className="font-medium text-aistroyka-info">{tDetail("lowLabel")} {riskOverview.low}</span>
          </div>
          <div className="mt-3">
            <RiskList risks={riskOverview.signals} maxItems={3} emptyMessage={tDetail("noRisksFlagged")} />
          </div>
        </IntelligenceCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EvidenceCoverageCard signals={evidenceCoverage.signals} emptyMessage={tDetail("noEvidenceGaps")} />
        <ReportingDisciplineCard signals={reportingDiscipline.signals} emptyMessage={tDetail("noReportingGaps")} />
      </div>

      {missingEvidenceInsights && missingEvidenceInsights.length > 0 && (
        <IntelligenceCard title={tDetail("missingEvidence")} aria-label={tDetail("missingEvidenceInsights")}>
          <ul className="space-y-3">
            {missingEvidenceInsights.slice(0, 5).map((me) => {
              const ref = me.evidenceReferences?.[0];
              const href = ref ? getResourceHref(ref.resourceType, ref.resourceId, projectId) : null;
              return (
                <li key={me.id} className="flex flex-col gap-0.5">
                  <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    {me.title}
                  </span>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">{me.explanation}</p>
                  <p className="text-xs text-aistroyka-text-tertiary">{me.recommendedAction}</p>
                  {me.missingDataDisclaimer && (
                    <p className="text-xs text-aistroyka-warning">{me.missingDataDisclaimer}</p>
                  )}
                  {href && (
                    <Link
                      href={href}
                      className="mt-1 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      {tDetail("openRelated")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </IntelligenceCard>
      )}

      {topRiskInsights && topRiskInsights.length > 0 && (
        <IntelligenceCard title={tDetail("topRisksRanked")} aria-label={tDetail("topRiskInsights")}>
          <ul className="space-y-3">
            {topRiskInsights.slice(0, 5).map((r) => {
              const ref = r.evidenceReferences?.[0];
              const href = ref ? getResourceHref(ref.resourceType, ref.resourceId, projectId) : null;
              return (
                <li key={r.id} className="flex flex-col gap-0.5">
                  <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    #{r.rank} {r.title}
                  </span>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">{r.explanation}</p>
                  <p className="text-xs text-aistroyka-text-tertiary">{r.recommendedAction}</p>
                  {r.missingDataDisclaimer && (
                    <p className="text-xs text-aistroyka-warning">{r.missingDataDisclaimer}</p>
                  )}
                  {href && (
                    <Link
                      href={href}
                      className="mt-1 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      {tDetail("openRelated")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </IntelligenceCard>
      )}

      {projectHealthScore?.factorContributions && projectHealthScore.factorContributions.length > 0 && (
        <IntelligenceCard title={tDetail("healthScoreFactors")} aria-label={tDetail("healthScoreBreakdown")}>
          <ul className="space-y-2 text-sm">
            {projectHealthScore.factorContributions.map((f, i) => (
              <li key={i}>
                <span className="font-medium">{f.factor}:</span>{" "}
                <span className="text-aistroyka-text-secondary">{f.explanation}</span>
              </li>
            ))}
          </ul>
        </IntelligenceCard>
      )}

      {insights.length > 0 && (
        <IntelligenceCard title={tDetail("managerInsights")} aria-label={tDetail("managerInsights")}>
          <ul className="space-y-2">
            {insights.slice(0, 5).map((i) => (
              <li key={i.id} className="flex flex-col gap-0.5">
                <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                  {i.title}
                </span>
                <p className="text-aistroyka-caption text-aistroyka-text-secondary">{i.body}</p>
              </li>
            ))}
          </ul>
        </IntelligenceCard>
      )}

      <RecommendationList recommendations={recommendations} emptyMessage={tDetail("noRecommendedActionsYet")} />

      <CopilotSummaryPanel projectId={projectId} />
    </section>
  );
}
