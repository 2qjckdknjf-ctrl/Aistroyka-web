"use client";

import { Link } from "@/i18n/navigation";
import type { PortfolioResult } from "@/lib/intelligence/portfolio";

function classificationClass(c: string): string {
  return c === "Healthy"
    ? "text-emerald-700"
    : c === "Moderate"
      ? "text-blue-700"
      : c === "Unstable"
        ? "text-amber-700"
        : "text-red-700";
}

export function PortfolioOverview({
  portfolio,
}: {
  portfolio: PortfolioResult;
}) {
  const { distribution, rankedProjects, summary } = portfolio;

  return (
    <div className="space-y-6">
      <section className="card text-sm">
        <h2 className="font-semibold text-aistroyka-text-primary">Portfolio Overview</h2>
        <div className="mt-3">
          <span className="text-aistroyka-text-tertiary">Distribution:</span>
          <ul className="mt-1 list-inside list-disc text-aistroyka-text-primary">
            <li>Healthy: {distribution.percentHealthy.toFixed(0)}%</li>
            <li>Moderate: {distribution.percentModerate.toFixed(0)}%</li>
            <li>Unstable: {distribution.percentUnstable.toFixed(0)}%</li>
            <li>Critical: {distribution.percentCritical.toFixed(0)}%</li>
          </ul>
        </div>
        <p className="mt-3 text-aistroyka-text-primary leading-relaxed">{summary}</p>
      </section>

      <section className="card text-sm">
        <h2 className="font-semibold text-aistroyka-text-primary">Ranked projects</h2>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          Sorted by risk (strategic risk index, delay probability, health score).
        </p>
        {rankedProjects.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {rankedProjects.map((p) => (
              <li key={p.projectId} className="flex flex-wrap items-center gap-2 rounded-card border border-aistroyka-border-subtle bg-white px-4 py-2.5 shadow-card transition-shadow hover:shadow-card-hover">
                <Link href={`/projects/${p.projectId}`} className="font-medium text-aistroyka-text-primary hover:text-aistroyka-accent">
                  {p.projectName}
                </Link>
                <span className={classificationClass(p.healthClassification)}>{p.healthClassification}</span>
                <span className="text-aistroyka-text-tertiary">Health {p.healthScore} · Risk {p.strategicRiskIndex}</span>
                {p.delayProbabilityHigh && (
                  <span className="rounded-card-sm bg-aistroyka-warning/20 px-1.5 py-0.5 text-xs text-aistroyka-warning">Delay high</span>
                )}
                {p.portfolioOutlier && (
                  <span className="rounded-card-sm bg-aistroyka-error/20 px-1.5 py-0.5 text-xs text-aistroyka-error">Portfolio outlier</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-aistroyka-text-tertiary">No projects to rank.</p>
        )}
      </section>
    </div>
  );
}
