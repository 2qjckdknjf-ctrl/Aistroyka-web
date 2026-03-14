"use client";

import { useQuery } from "@tanstack/react-query";
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
  type ProjectIntelligenceData,
} from "@/components/intelligence";
import { Card, Skeleton, ErrorState } from "@/components/ui";

async function fetchIntelligence(projectId: string): Promise<ProjectIntelligenceData> {
  const res = await fetch(`/api/v1/projects/${projectId}/intelligence`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load intelligence");
  }
  const json = await res.json();
  return json.data;
}

export function ProjectIntelligenceClient({ projectId }: { projectId: string }) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["project-intelligence", projectId],
    queryFn: () => fetchIntelligence(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Intelligence unavailable"}
        onRetry={() => refetch()}
      />
    );
  }

  if (isPending || !data) {
    return (
      <section className="space-y-4" aria-label="Intelligence loading">
        <Card>
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><Skeleton className="h-24" /></Card>
          <Card><Skeleton className="h-24" /></Card>
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
  } = data;

  const healthToShow = projectHealthScore ?? health;
  const summaryToShow = executiveProjectSummary ?? executiveSummary;

  return (
    <section className="space-y-6" aria-label="Project intelligence">
      <ManagerActionView data={data} projectId={projectId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectHealthPanel health={healthToShow} emptyMessage="No health data" />
        {summaryToShow && (
          <SummaryCard summary={summaryToShow} />
        )}
        {!summaryToShow && (
          <IntelligenceCard title="Executive summary">
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
              No summary available
            </p>
          </IntelligenceCard>
        )}
        <IntelligenceCard title="Risk radar" aria-label="Risk overview">
          <div className="flex flex-wrap gap-2 text-aistroyka-caption">
            <span className="font-medium text-aistroyka-error">High: {riskOverview.high}</span>
            <span className="font-medium text-amber-600">Medium: {riskOverview.medium}</span>
            <span className="font-medium text-aistroyka-info">Low: {riskOverview.low}</span>
          </div>
          <div className="mt-3">
            <RiskList risks={riskOverview.signals} maxItems={3} emptyMessage="No risks" />
          </div>
        </IntelligenceCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EvidenceCoverageCard
          signals={evidenceCoverage.signals}
          emptyMessage="No evidence gaps"
        />
        <ReportingDisciplineCard
          signals={reportingDiscipline.signals}
          emptyMessage="No reporting issues"
        />
      </div>

      {missingEvidenceInsights && missingEvidenceInsights.length > 0 && (
        <IntelligenceCard title="Missing evidence" aria-label="Missing evidence insights">
          <ul className="space-y-3">
            {missingEvidenceInsights.slice(0, 5).map((me) => {
              const ref = me.evidenceReferences?.[0];
              const href = ref
                ? getResourceHref(ref.resourceType, ref.resourceId, projectId)
                : null;
              return (
                <li key={me.id} className="flex flex-col gap-0.5">
                  <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    {me.title}
                  </span>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">
                    {me.explanation}
                  </p>
                  <p className="text-xs text-aistroyka-text-tertiary">
                    {me.recommendedAction}
                  </p>
                  {me.missingDataDisclaimer && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {me.missingDataDisclaimer}
                    </p>
                  )}
                  {href && (
                    <Link
                      href={href}
                      className="mt-1 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      Open related →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </IntelligenceCard>
      )}

      {topRiskInsights && topRiskInsights.length > 0 && (
        <IntelligenceCard title="Top risks (ranked)" aria-label="Top risk insights">
          <ul className="space-y-3">
            {topRiskInsights.slice(0, 5).map((r) => {
              const ref = r.evidenceReferences?.[0];
              const href = ref
                ? getResourceHref(ref.resourceType, ref.resourceId, projectId)
                : null;
              return (
                <li key={r.id} className="flex flex-col gap-0.5">
                  <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    #{r.rank} {r.title}
                  </span>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">
                    {r.explanation}
                  </p>
                  <p className="text-xs text-aistroyka-text-tertiary">
                    {r.recommendedAction}
                  </p>
                  {r.missingDataDisclaimer && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {r.missingDataDisclaimer}
                    </p>
                  )}
                  {href && (
                    <Link
                      href={href}
                      className="mt-1 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      Open related →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </IntelligenceCard>
      )}

      {projectHealthScore?.factorContributions && projectHealthScore.factorContributions.length > 0 && (
        <IntelligenceCard title="Health score factors" aria-label="Health score breakdown">
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
        <IntelligenceCard title="Manager insights" aria-label="Manager insights">
          <ul className="space-y-2">
            {insights.slice(0, 5).map((i) => (
              <li key={i.id} className="flex flex-col gap-0.5">
                <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                  {i.title}
                </span>
                <p className="text-aistroyka-caption text-aistroyka-text-secondary">
                  {i.body}
                </p>
              </li>
            ))}
          </ul>
        </IntelligenceCard>
      )}

      <RecommendationList
        recommendations={recommendations}
        emptyMessage="No recommended actions"
      />

      <CopilotSummaryPanel projectId={projectId} />
    </section>
  );
}
