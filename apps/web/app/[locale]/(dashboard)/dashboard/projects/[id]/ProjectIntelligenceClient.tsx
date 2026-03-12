"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ProjectHealthPanel,
  RiskList,
  IntelligenceCard,
  EvidenceCoverageCard,
  ReportingDisciplineCard,
  SummaryCard,
  RecommendationList,
  CopilotSummaryPanel,
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

  const { health, insights, riskOverview, evidenceCoverage, reportingDiscipline, executiveSummary, recommendations } = data;

  return (
    <section className="space-y-6" aria-label="Project intelligence">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectHealthPanel health={health} emptyMessage="No health data" />
        {executiveSummary && (
          <SummaryCard summary={executiveSummary} />
        )}
        {!executiveSummary && (
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
