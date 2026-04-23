"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { getResourceHref } from "@/lib/intelligence/resource-links";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { IntelligenceCard } from "@/components/intelligence";

export interface PortfolioSummaryProject {
  id: string;
  name: string;
  healthScore: number | null;
  healthLabel: string | null;
  riskHigh: number;
  riskMedium: number;
  riskLow: number;
  evidenceGapCount: number;
  missingEvidenceCount: number;
  overBudget: boolean;
  varianceAmount: number;
  topRisks: { title: string; severity: string }[];
  requiresAttentionReasons: string[];
  confidence: string | null;
  recommendations: {
    title: string;
    priority: string;
    relatedResourceType?: string;
    relatedResourceId?: string;
  }[];
}

export interface PortfolioSummaryData {
  projects: PortfolioSummaryProject[];
  distribution: {
    healthy: number;
    moderate: number;
    unstable: number;
    critical: number;
    lowConfidence: number;
    noData: number;
  };
  budgetPressure: { projectId: string; projectName: string; overBudget: boolean; varianceAmount: number }[];
  portfolioRisks: { projectId: string; projectName: string; title: string; severity: string }[];
  recommendedActions: {
    projectId: string;
    projectName: string;
    title: string;
    priority: string;
    relatedResourceType?: string;
    relatedResourceId?: string;
  }[];
  totalProjects: number;
  limitedTo: number;
  governanceOpenCount?: number;
  governanceCriticalOpenCount?: number;
  commercialOverdueCount?: number;
  commercialOpenUnpaidCount?: number;
}

async function fetchPortfolioSummary(): Promise<PortfolioSummaryData> {
  const res = await fetch("/api/v1/portfolio/summary", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load portfolio");
  }
  const json = await res.json();
  return json.data;
}

export function PortfolioCommandViewClient() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["portfolio-summary"],
    queryFn: fetchPortfolioSummary,
    staleTime: 60 * 1000,
  });

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load portfolio"}
        onRetry={() => refetch()}
      />
    );
  }

  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const {
    projects,
    distribution,
    budgetPressure,
    portfolioRisks,
    recommendedActions,
    totalProjects,
    limitedTo,
    governanceOpenCount = 0,
    governanceCriticalOpenCount = 0,
    commercialOverdueCount = 0,
    commercialOpenUnpaidCount = 0,
  } = data;
  const attentionProjects = projects.filter((p) => p.requiresAttentionReasons.length > 0);
  const evidenceGapProjects = projects.filter((p) => p.evidenceGapCount > 0 || p.missingEvidenceCount > 0);
  const lowConfidenceCount = distribution.lowConfidence + distribution.noData;

  return (
    <div className="space-y-6">
      {totalProjects > limitedTo && (
        <p className="text-aistroyka-caption text-aistroyka-text-tertiary">
          Showing first {limitedTo} of {totalProjects} projects.
        </p>
      )}

      {governanceOpenCount > 0 && (
        <Card className="border-l-4 border-l-aistroyka-warning p-4 bg-aistroyka-surface">
          <p className="text-sm text-aistroyka-text-primary">
            <strong>{governanceOpenCount}</strong> open governance case(s)
            {governanceCriticalOpenCount > 0
              ? ` — ${governanceCriticalOpenCount} critical`
              : ""}
            .
          </p>
          <Link
            href="/dashboard/governance"
            className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
          >
            Review governance →
          </Link>
        </Card>
      )}

      {commercialOverdueCount > 0 && (
        <Card className="border-l-4 border-l-aistroyka-error p-4 bg-aistroyka-surface">
          <p className="text-sm text-aistroyka-text-primary">
            <strong>{commercialOverdueCount}</strong> commercial billing line(s) overdue or unpaid past due date
            {commercialOpenUnpaidCount > commercialOverdueCount
              ? ` — ${commercialOpenUnpaidCount} open unpaid total`
              : ""}
            .
          </p>
          <p className="mt-1 text-xs text-aistroyka-text-tertiary">
            Open a project&apos;s Commercial tab to record payment or issue follow-up.
          </p>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Portfolio Health Overview">
        <IntelligenceCard title="Portfolio health" aria-label="Portfolio health distribution">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-aistroyka-subheadline">
            <dt className="text-aistroyka-text-tertiary">Healthy</dt>
            <dd className="font-medium text-aistroyka-success">{distribution.healthy}</dd>
            <dt className="text-aistroyka-text-tertiary">Moderate</dt>
            <dd className="font-medium text-aistroyka-warning">{distribution.moderate}</dd>
            <dt className="text-aistroyka-text-tertiary">Unstable</dt>
            <dd className="font-medium text-aistroyka-warning">{distribution.unstable}</dd>
            <dt className="text-aistroyka-text-tertiary">Critical</dt>
            <dd className="font-medium text-aistroyka-error">{distribution.critical}</dd>
            <dt className="text-aistroyka-text-tertiary">Low confidence / no data</dt>
            <dd className="font-medium text-aistroyka-text-tertiary">{lowConfidenceCount}</dd>
          </dl>
          <Link
            href="/dashboard/projects"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            Open projects →
          </Link>
        </IntelligenceCard>

        <IntelligenceCard title="Projects requiring attention" aria-label="Projects requiring attention">
          {attentionProjects.length === 0 ? (
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
              No projects requiring immediate attention.
            </p>
          ) : (
            <ul className="space-y-2">
              {attentionProjects.slice(0, 5).map((p) => (
                <li key={p.id} className="flex flex-col gap-0.5">
                  <Link
                    href={`/dashboard/projects/${p.id}?tab=intelligence`}
                    className="font-medium text-aistroyka-accent hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-aistroyka-text-tertiary">{p.requiresAttentionReasons.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/projects"
            className="mt-2 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
          >
            All projects →
          </Link>
        </IntelligenceCard>

        <IntelligenceCard title="Portfolio risk radar" aria-label="Portfolio risks">
          {portfolioRisks.length === 0 ? (
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No risks flagged across portfolio.</p>
          ) : (
            <ul className="space-y-2">
              {portfolioRisks.slice(0, 5).map((r, i) => (
                <li key={`${r.projectId}-${i}`} className="flex flex-col gap-0.5">
                  <span className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{r.title}</span>
                  <Link
                    href={`/dashboard/projects/${r.projectId}?tab=intelligence`}
                    className="text-xs text-aistroyka-accent hover:underline"
                  >
                    {r.projectName} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </IntelligenceCard>

        <IntelligenceCard title="Evidence / confidence coverage" aria-label="Evidence and confidence">
          {evidenceGapProjects.length === 0 && lowConfidenceCount === 0 ? (
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
              No evidence gaps or low-confidence projects.
            </p>
          ) : (
            <>
              <p className="text-aistroyka-caption text-aistroyka-text-secondary">
                {evidenceGapProjects.length} project(s) with evidence gaps. {lowConfidenceCount} low-confidence or no data.
              </p>
              <ul className="mt-2 space-y-1">
                {evidenceGapProjects.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/projects/${p.id}?tab=intelligence`}
                      className="text-sm font-medium text-aistroyka-accent hover:underline"
                    >
                      {p.name} ({p.evidenceGapCount + p.missingEvidenceCount} gaps)
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </IntelligenceCard>

        <IntelligenceCard title="Budget pressure" aria-label="Budget pressure">
          {budgetPressure.length === 0 ? (
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">
              No over-budget or high-variance projects.
            </p>
          ) : (
            <ul className="space-y-2">
              {budgetPressure.slice(0, 5).map((b) => (
                <li key={b.projectId} className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/projects/${b.projectId}?tab=costs`}
                    className="font-medium text-aistroyka-accent hover:underline"
                  >
                    {b.projectName}
                  </Link>
                  {b.overBudget && (
                    <span className="rounded bg-aistroyka-error/20 px-1.5 py-0.5 text-xs text-aistroyka-error">
                      Over budget
                    </span>
                  )}
                  {b.varianceAmount !== 0 && (
                    <span className="text-xs text-aistroyka-text-tertiary">
                      Variance: {b.varianceAmount > 0 ? "+" : ""}{b.varianceAmount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </IntelligenceCard>

        <IntelligenceCard title="Recommended portfolio actions" aria-label="Recommended actions">
          {recommendedActions.length === 0 ? (
            <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No recommended actions.</p>
          ) : (
            <ul className="space-y-2">
              {recommendedActions.map((a, i) => {
                const href =
                  a.relatedResourceType && a.relatedResourceId
                    ? getResourceHref(a.relatedResourceType, a.relatedResourceId, a.projectId)
                    : `/dashboard/projects/${a.projectId}?tab=intelligence`;
                return (
                  <li key={`${a.projectId}-${i}`} className="flex flex-col gap-0.5">
                    <Link href={href ?? "#"} className="font-medium text-aistroyka-accent hover:underline">
                      {a.title}
                    </Link>
                    <span className="text-xs text-aistroyka-text-tertiary">{a.projectName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </IntelligenceCard>
      </section>
    </div>
  );
}
