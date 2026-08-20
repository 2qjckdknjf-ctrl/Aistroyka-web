"use client";

import { Badge } from "@/components/ui";
import { PLATFORM_ADMIN_BASE_PATH, PLATFORM_ADMIN_PREFERRED_HOST } from "@/lib/platform-admin/constants";
import type { RomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.types";
import type { RomaEngineeringIntelligence } from "@/lib/platform-admin/roma-engineering-intelligence.types";
import {
  blockerSeverityBadgeVariant,
  confidenceBadgeVariant,
  formatPercent,
  formatTimestamp,
  productAreaBadgeVariant,
  productAreaStatusLabel,
  qualityStatusBadgeVariant,
  readinessBadgeVariant,
  releaseDecisionBadgeVariant,
  releaseDecisionBorderClass,
} from "@/lib/platform-admin/quality-dashboard-ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Props = {
  dashboard: RomaQualityDashboard;
  intelligence: RomaEngineeringIntelligence;
};

function SummaryMetric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-[9rem] flex-1 rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-3 py-aistroyka-2">
      <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
        {label}
      </p>
      <p className="mt-aistroyka-1 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{value}</p>
      {hint ? <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">{hint}</p> : null}
    </div>
  );
}

export function PlatformAdminTestingClient({ dashboard, intelligence }: Props) {
  const d = dashboard;
  const intel = intelligence;
  const summary = intel.ownerSummary;

  return (
    <section className="space-y-aistroyka-6" aria-label="ROMA live operations center">
      <DashboardGlassCard className={`p-aistroyka-5 ${releaseDecisionBorderClass(intel.releaseDecision)}`}>
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div className="min-w-0 flex-1">
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              Owner operator summary
            </p>
            <h1 className="mt-aistroyka-1 text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
              ROMA Testing
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              {intel.engineeringAssessment}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-aistroyka-2">
            <Badge variant={releaseDecisionBadgeVariant(intel.releaseDecision)} className="text-sm">
              {summary.releaseDecisionLabel}
            </Badge>
            <Badge variant={confidenceBadgeVariant(intel.confidenceScore)}>{summary.confidenceLabel} confidence</Badge>
            <Badge variant="neutral">Read-only</Badge>
          </div>
        </div>

        <div className="mt-aistroyka-4 flex flex-wrap gap-aistroyka-2">
          <SummaryMetric label="Release recommendation" value={summary.releaseDecisionLabel} />
          <SummaryMetric label="Confidence" value={summary.confidenceLabel} />
          <SummaryMetric label="Readiness score" value={summary.readinessScoreLabel} />
          <SummaryMetric label="Critical blockers" value={String(summary.criticalBlockersCount)} />
          <SummaryMetric label="Warnings" value={String(summary.warningCount)} />
          <SummaryMetric label="Evidence coverage" value={formatPercent(summary.evidenceCoveragePercent)} />
          <SummaryMetric label="Environment" value={summary.environment} hint={d.environment.appUrl ?? undefined} />
          <SummaryMetric label="Last updated" value={formatTimestamp(summary.lastUpdated)} />
        </div>

        <div className="mt-aistroyka-4 rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3">
          <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Next safe action</p>
          <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-primary">{summary.nextSafeAction}</p>
        </div>

        <p className="mt-aistroyka-3 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Platform owner only · no test execution · route{" "}
          <code className="rounded bg-aistroyka-surface-raised px-1">/[locale]{PLATFORM_ADMIN_BASE_PATH}/testing</code>
          {d.environment.preferredAdminHost ? (
            <>
              {" "}
              · preferred host <code className="rounded bg-aistroyka-surface-raised px-1">{PLATFORM_ADMIN_PREFERRED_HOST}</code> pending
            </>
          ) : null}
        </p>
      </DashboardGlassCard>

      <DashboardGlassCard className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Why this decision?</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Top evidence-backed reasons from live probes (max 5). Recommendation-only — no automatic fixes.
        </p>
        {intel.decisionReasons.length > 0 ? (
          <ul className="mt-aistroyka-4 space-y-aistroyka-3">
            {intel.decisionReasons.map((reason) => (
              <li
                key={`${reason.component}-${reason.title}`}
                className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
              >
                <div className="flex flex-wrap items-center gap-aistroyka-2">
                  <p className="font-medium text-aistroyka-text-primary">{reason.title}</p>
                  <Badge variant={blockerSeverityBadgeVariant(reason.severity)}>{reason.severity}</Badge>
                  <span className="text-aistroyka-caption text-aistroyka-text-tertiary">{reason.component}</span>
                </div>
                <dl className="mt-aistroyka-3 grid gap-aistroyka-2 text-aistroyka-footnote sm:grid-cols-2">
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Evidence</dt>
                    <dd className="text-aistroyka-text-secondary">{reason.evidence}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Impact</dt>
                    <dd className="text-aistroyka-text-secondary">{reason.impact}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Recommendation</dt>
                    <dd className="text-aistroyka-text-secondary">{reason.recommendation}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">Recheck when</dt>
                    <dd className="text-aistroyka-text-secondary">{reason.recheckCondition}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
            No material issues detected — release posture is based on healthy probe evidence.
          </p>
        )}
      </DashboardGlassCard>

      <DashboardGlassCard className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Business impact by product area</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Marked affected only when probe evidence supports it. Unknown means ROMA cannot confirm from current data.
        </p>
        <div className="mt-aistroyka-4 grid gap-aistroyka-2 sm:grid-cols-2 lg:grid-cols-3">
          {intel.affectedProductAreas.map((area) => (
            <div
              key={area.id}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2"
            >
              <div className="flex items-center justify-between gap-aistroyka-2">
                <p className="font-medium text-aistroyka-text-primary">{area.label}</p>
                <Badge variant={productAreaBadgeVariant(area.status)}>{productAreaStatusLabel(area.status)}</Badge>
              </div>
              {area.evidence ? (
                <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">{area.evidence}</p>
              ) : (
                <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">No evidence of impact.</p>
              )}
            </div>
          ))}
        </div>
      </DashboardGlassCard>

      <DashboardGlassCard className="border border-dashed border-aistroyka-border-subtle p-aistroyka-5">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-2">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Data coverage & trust</h2>
          <Badge variant={intel.confidenceScore === "low" ? "danger" : intel.confidenceScore === "medium" ? "warning" : "neutral"}>
            {formatPercent(d.dataCoverage.coveragePercent)}
          </Badge>
        </div>
        <p className="mt-aistroyka-3 text-aistroyka-subheadline text-aistroyka-text-secondary">{intel.coverageExplanation}</p>
        <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Last refresh: {formatTimestamp(d.dataCoverage.lastRefresh)} · {d.dataCoverage.connectedCount}/
          {d.dataCoverage.totalCatalogCount} sources connected
        </p>
        {intel.coverageBlindSpots.length > 0 ? (
          <div className="mt-aistroyka-4">
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Blind spots</p>
            <ul className="mt-aistroyka-2 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
              {intel.coverageBlindSpots.slice(0, 8).map((spot) => (
                <li key={spot}>{spot}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </DashboardGlassCard>

      <details className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface p-aistroyka-4">
        <summary className="cursor-pointer text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Detailed probe dashboard
        </summary>
        <div className="mt-aistroyka-5 space-y-aistroyka-6">
          <div>
            <h3 className="mb-aistroyka-3 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Domain overview</h3>
            <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.domainSections.map((section) => (
                <DashboardGlassCard key={section.id} className="p-aistroyka-4">
                  <div className="flex items-center justify-between gap-aistroyka-2">
                    <h4 className="font-semibold text-aistroyka-text-primary">{section.label}</h4>
                    <Badge variant={qualityStatusBadgeVariant(section.status)}>{section.statusLabel}</Badge>
                  </div>
                  <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">{section.summary}</p>
                </DashboardGlassCard>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-aistroyka-3 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">System components</h3>
            <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.systemComponents.map((component) => (
                <DashboardGlassCard key={component.id} className="p-aistroyka-4">
                  <div className="flex items-center justify-between gap-aistroyka-2">
                    <h4 className="font-semibold text-aistroyka-text-primary">{component.name}</h4>
                    <Badge variant={qualityStatusBadgeVariant(component.status)}>{component.statusLabel}</Badge>
                  </div>
                  <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">{component.details}</p>
                </DashboardGlassCard>
              ))}
            </div>
          </div>

          <DashboardGlassCard className="p-aistroyka-4">
            <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Release readiness by category</h3>
            <div className="mt-aistroyka-3 grid gap-aistroyka-2 sm:grid-cols-2 lg:grid-cols-4">
              {d.releaseReadiness.map((category) => (
                <div key={category.id} className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2">
                  <div className="flex items-center justify-between gap-aistroyka-2">
                    <p className="font-medium text-aistroyka-text-primary">{category.label}</p>
                    <Badge variant={readinessBadgeVariant(category.level)}>{formatPercent(category.percent)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </DashboardGlassCard>

          <DashboardGlassCard className="p-aistroyka-4">
            <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Platform timeline</h3>
            <dl className="mt-aistroyka-3 grid gap-aistroyka-2 sm:grid-cols-2 lg:grid-cols-3">
              {d.platformTimeline.map((event) => (
                <div key={event.id}>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{event.label}</dt>
                  <dd className="font-medium text-aistroyka-text-primary">{event.displayValue}</dd>
                </div>
              ))}
            </dl>
          </DashboardGlassCard>

          <div className="grid gap-aistroyka-4 lg:grid-cols-2">
            <div>
              <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Connected sources</p>
              <ul className="mt-aistroyka-2 space-y-aistroyka-2">
                {d.dataCoverage.available.map((source) => (
                  <li key={source.id} className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2 text-aistroyka-footnote">
                    <span className="font-medium text-aistroyka-text-primary">{source.label}</span>
                    <span className="text-aistroyka-text-tertiary"> — {source.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Unavailable sources</p>
              <ul className="mt-aistroyka-2 space-y-aistroyka-2">
                {d.dataCoverage.unavailable.map((source) => (
                  <li key={source.id} className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2 text-aistroyka-footnote">
                    <span className="font-medium text-aistroyka-text-primary">{source.label}</span>
                    <span className="text-aistroyka-text-tertiary"> — {source.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
