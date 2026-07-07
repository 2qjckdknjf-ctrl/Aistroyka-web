"use client";

import { Link } from "@/i18n/navigation";
import { Card, Badge } from "@/components/ui";
import { PLATFORM_ADMIN_BASE_PATH } from "@/lib/platform-admin/constants";
import type { RomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.types";
import type { QualityStatus } from "@/lib/platform-admin/roma-quality-dashboard.types";
import type { RomaEngineeringIntelligence } from "@/lib/platform-admin/roma-engineering-intelligence.types";
import type { RomaAuditRunListItem } from "@/lib/platform-admin/roma-run-history.types";
import {
  buildExecutiveSummaryNarrative,
  findSystemComponent,
  formatCurrentBuildLabel,
  formatDeployShaForDiagnostics,
  formatLastAuditLabel,
  groupDecisionReasonsBySeverity,
} from "@/lib/platform-admin/executive-dashboard-ui";
import {
  blockerSeverityBadgeVariant,
  confidenceBadgeVariant,
  formatPercent,
  formatTimestamp,
  productAreaBadgeVariant,
  productAreaStatusLabel,
  qualityStatusBadgeVariant,
  releaseDecisionBadgeVariant,
  releaseDecisionBorderClass,
} from "@/lib/platform-admin/quality-dashboard-ui";

type Props = {
  dashboard: RomaQualityDashboard;
  intelligence: RomaEngineeringIntelligence;
  recentAudits: readonly RomaAuditRunListItem[];
};

function OverviewCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3">
      <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
        {label}
      </p>
      <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{value}</p>
      {hint ? <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">{hint}</p> : null}
    </div>
  );
}

function HealthCard({ name, statusLabel, status }: { name: string; statusLabel: string; status: QualityStatus }) {
  return (
    <div className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2">
      <div className="flex items-center justify-between gap-aistroyka-2">
        <p className="font-medium text-aistroyka-text-primary">{name}</p>
        <Badge variant={qualityStatusBadgeVariant(status)}>{statusLabel}</Badge>
      </div>
    </div>
  );
}

function ActionLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-4 transition-colors hover:border-aistroyka-accent hover:bg-aistroyka-surface"
    >
      <p className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{title}</p>
      <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">{description}</p>
    </Link>
  );
}

const TESTING_BASE = `${PLATFORM_ADMIN_BASE_PATH}/testing`;

export function PlatformAdminTestingClient({ dashboard, intelligence, recentAudits }: Props) {
  const d = dashboard;
  const intel = intelligence;
  const summary = intel.ownerSummary;
  const narrative = buildExecutiveSummaryNarrative(d, intel);
  const groupedRisks = groupDecisionReasonsBySeverity(intel.decisionReasons);

  const aiHealth = findSystemComponent(d, "ai");
  const dbHealth = findSystemComponent(d, "database");
  const storageHealth = findSystemComponent(d, "storage");
  const securityHealth = findSystemComponent(d, "security");

  return (
    <section className="space-y-aistroyka-8" aria-label="Executive operations dashboard">
      {/* Section 1 — Platform Overview */}
      <div id="platform-overview" className="space-y-aistroyka-4">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              Platform overview
            </p>
            <h1 className="mt-aistroyka-1 text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary">
              Executive Operations Dashboard
            </h1>
            <p className="mt-aistroyka-2 max-w-2xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              Live platform posture for platform owners — read-only intelligence, no execution.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-aistroyka-2">
            <Badge variant={releaseDecisionBadgeVariant(intel.releaseDecision)} className="text-sm">
              {summary.releaseDecisionLabel}
            </Badge>
            <Badge variant={confidenceBadgeVariant(intel.confidenceScore)}>{summary.confidenceLabel}</Badge>
            <Badge variant="neutral">Read-only</Badge>
          </div>
        </div>

        <Card className={`p-aistroyka-5 ${releaseDecisionBorderClass(intel.releaseDecision)}`}>
          <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard label="Platform status" value={d.platformStatus.overallHealthLabel} />
            <OverviewCard label="Production" value={d.environment.label} hint={d.environment.appUrl ?? undefined} />
            <OverviewCard label="Current build" value={formatCurrentBuildLabel(d)} />
            <OverviewCard label="Last audit" value={formatLastAuditLabel(recentAudits)} />
            <OverviewCard label="Coverage" value={formatPercent(summary.evidenceCoveragePercent)} />
            <OverviewCard label="Confidence" value={summary.confidenceLabel} />
            <OverviewCard label="Release recommendation" value={summary.releaseDecisionLabel} />
            <OverviewCard label="Critical issues" value={String(summary.criticalBlockersCount)} />
            <OverviewCard label="Warnings" value={String(summary.warningCount)} />
            <OverviewCard label="Environment" value={summary.environment} />
            <OverviewCard label="Last refresh" value={formatTimestamp(d.dataCoverage.lastRefresh)} />
          </div>

          <div className="mt-aistroyka-5">
            <p className="mb-aistroyka-3 text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              System health
            </p>
            <div className="grid gap-aistroyka-2 sm:grid-cols-2 lg:grid-cols-4">
              <HealthCard name="AI" statusLabel={aiHealth?.statusLabel ?? "Unknown"} status={aiHealth?.status ?? "unknown"} />
              <HealthCard
                name="Database"
                statusLabel={dbHealth?.statusLabel ?? "Unknown"}
                status={dbHealth?.status ?? "unknown"}
              />
              <HealthCard
                name="Storage"
                statusLabel={storageHealth?.statusLabel ?? "Unknown"}
                status={storageHealth?.status ?? "unknown"}
              />
              <HealthCard
                name="Security"
                statusLabel={securityHealth?.statusLabel ?? "Unknown"}
                status={securityHealth?.status ?? "unknown"}
              />
            </div>
          </div>

          <details className="mt-aistroyka-5 rounded-card border border-dashed border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3">
            <summary className="cursor-pointer text-aistroyka-footnote font-medium text-aistroyka-text-secondary">
              Diagnostics (technical)
            </summary>
            <dl className="mt-aistroyka-3 grid gap-aistroyka-2 text-aistroyka-footnote sm:grid-cols-2">
              <div>
                <dt className="text-aistroyka-text-tertiary">Deploy SHA</dt>
                <dd className="font-mono text-aistroyka-text-secondary">{formatDeployShaForDiagnostics(d)}</dd>
              </div>
              <div>
                <dt className="text-aistroyka-text-tertiary">Data sources</dt>
                <dd className="text-aistroyka-text-secondary">
                  {d.dataCoverage.connectedCount}/{d.dataCoverage.totalCatalogCount} connected
                </dd>
              </div>
              <div>
                <dt className="text-aistroyka-text-tertiary">Generated at</dt>
                <dd className="text-aistroyka-text-secondary">{formatTimestamp(d.generatedAt)}</dd>
              </div>
            </dl>
          </details>
        </Card>
      </div>

      {/* Section 2 — Action Center */}
      <div id="action-center" className="space-y-aistroyka-3">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Action center</h2>
        <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">
          Safe owner workflows only — navigate to the right surface. No deploy, fix, or test execution from this page.
        </p>
        <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionLinkCard
            href={`${TESTING_BASE}/safe-audit`}
            title="Refresh safe audit"
            description="Open the safe readonly audit view and refresh live evidence."
          />
          <ActionLinkCard
            href={`${TESTING_BASE}/safe-audit`}
            title="Save snapshot"
            description="Persist a redacted audit snapshot from the safe audit page."
          />
          <ActionLinkCard
            href={`${TESTING_BASE}/audit-runs`}
            title="View audit history"
            description="Browse saved audit run summaries."
          />
          <ActionLinkCard
            href="#release-readiness"
            title="Open release readiness"
            description="Jump to the release readiness verdict on this dashboard."
          />
        </div>
      </div>

      {/* Section 3 — Executive Summary */}
      <Card id="executive-summary" className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Executive summary</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Generated from live engineering intelligence — same rule engine as release decisions.
        </p>
        <ul className="mt-aistroyka-4 space-y-aistroyka-2">
          {narrative.map((line) => (
            <li key={line} className="flex gap-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-primary">
              <span className="text-aistroyka-accent" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-aistroyka-4 text-aistroyka-footnote text-aistroyka-text-secondary">{intel.engineeringAssessment}</p>
      </Card>

      {/* Section 4 — Current Risks */}
      <div id="current-risks" className="space-y-aistroyka-3">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Current risks</h2>
        {intel.decisionReasons.length === 0 ? (
          <Card className="p-aistroyka-5">
            <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
              No material risks detected from current live probes.
            </p>
          </Card>
        ) : (
          <div className="grid gap-aistroyka-4 lg:grid-cols-3">
            {(
              [
                ["critical", groupedRisks.critical],
                ["warning", groupedRisks.warning],
                ["information", groupedRisks.information],
              ] as const
            ).map(([key, items]) => (
              <Card key={key} className="p-aistroyka-4">
                <div className="flex items-center justify-between gap-aistroyka-2">
                  <h3 className="font-semibold capitalize text-aistroyka-text-primary">{key}</h3>
                  <Badge variant={blockerSeverityBadgeVariant(key === "information" ? "information" : key)}>
                    {items.length}
                  </Badge>
                </div>
                {items.length > 0 ? (
                  <ul className="mt-aistroyka-3 space-y-aistroyka-3">
                    {items.map((reason) => (
                      <li
                        key={`${reason.component}-${reason.title}`}
                        className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2"
                      >
                        <p className="font-medium text-aistroyka-text-primary">{reason.title}</p>
                        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">
                          {reason.impact}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-aistroyka-3 text-aistroyka-footnote text-aistroyka-text-tertiary">None</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 5 — Business Impact */}
      <Card id="business-impact" className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Business impact</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Product areas marked affected only when probe evidence supports it.
        </p>
        <div className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
          {intel.affectedProductAreas.map((area) => (
            <div
              key={area.id}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
            >
              <div className="flex items-center justify-between gap-aistroyka-2">
                <p className="font-semibold text-aistroyka-text-primary">{area.label}</p>
                <Badge variant={productAreaBadgeVariant(area.status)}>{productAreaStatusLabel(area.status)}</Badge>
              </div>
              {area.evidence ? (
                <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">{area.evidence}</p>
              ) : (
                <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-tertiary">No impact evidence.</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Section 6 — Recent Audits */}
      <Card id="recent-audits" className="p-aistroyka-5">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-2">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Recent audits</h2>
          <Link
            href={`${TESTING_BASE}/audit-runs`}
            className="text-aistroyka-footnote font-medium text-aistroyka-accent hover:underline"
          >
            View all
          </Link>
        </div>
        {recentAudits.length === 0 ? (
          <p className="mt-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
            No saved audit snapshots yet. Use Save Snapshot on the safe audit page.
          </p>
        ) : (
          <ul className="mt-aistroyka-4 divide-y divide-aistroyka-border-subtle">
            {recentAudits.slice(0, 5).map((run) => (
              <li key={run.id} className="flex flex-wrap items-center justify-between gap-aistroyka-3 py-aistroyka-3">
                <div>
                  <p className="font-medium text-aistroyka-text-primary">{formatTimestamp(run.createdAt)}</p>
                  <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">
                    {run.environment} · {run.status} · {run.criticalCount} critical · {run.warningCount} warnings
                  </p>
                </div>
                <Badge variant={releaseDecisionBadgeVariant(run.releaseRecommendation)}>
                  {run.releaseRecommendation.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Section 7 — Release Readiness */}
      <Card id="release-readiness" className={`p-aistroyka-6 ${releaseDecisionBorderClass(intel.releaseDecision)}`}>
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-4">
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              Release readiness
            </p>
            <p className="mt-aistroyka-2 text-aistroyka-title font-bold text-aistroyka-text-primary">
              {summary.releaseDecisionLabel}
            </p>
            <p className="mt-aistroyka-2 max-w-2xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              {intel.riskAnalysis}
            </p>
          </div>
          <Badge variant={releaseDecisionBadgeVariant(intel.releaseDecision)} className="text-base px-aistroyka-4 py-aistroyka-2">
            {summary.readinessScoreLabel} readiness
          </Badge>
        </div>
        {intel.decisionReasons.length > 0 ? (
          <div className="mt-aistroyka-5">
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Why</p>
            <ul className="mt-aistroyka-3 space-y-aistroyka-2">
              {intel.decisionReasons.slice(0, 5).map((reason) => (
                <li key={`${reason.component}-${reason.title}`} className="text-aistroyka-subheadline text-aistroyka-text-secondary">
                  <span className="font-medium text-aistroyka-text-primary">{reason.title}</span>
                  {" — "}
                  {reason.recommendation}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-aistroyka-5 text-aistroyka-subheadline text-aistroyka-text-secondary">
            Release posture is supported by healthy live probe evidence.
          </p>
        )}
        <p className="mt-aistroyka-4 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Next safe action: {summary.nextSafeAction}
        </p>
      </Card>
    </section>
  );
}
