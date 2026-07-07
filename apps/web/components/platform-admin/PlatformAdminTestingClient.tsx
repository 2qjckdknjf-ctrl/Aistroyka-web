"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui";
import { PLATFORM_ADMIN_BASE_PATH } from "@/lib/platform-admin/constants";
import type { RomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.types";
import type { QualityStatus } from "@/lib/platform-admin/roma-quality-dashboard.types";
import type { RomaEngineeringIntelligence, ProductAreaImpact } from "@/lib/platform-admin/roma-engineering-intelligence.types";
import type { RomaAuditRunListItem } from "@/lib/platform-admin/roma-run-history.types";
import type { ExecutiveAction, HealthBucket } from "@/lib/platform-admin/executive-dashboard-ui";
import {
  buildPlainEnglishReleaseWhy,
  buildPlatformHealthCards,
  buildPrioritizedActions,
  buildRecentChangesTimeline,
  formatDeployShaForDiagnostics,
  formatLastAuditLabel,
  formatTimelineTime,
  groupBusinessImpact,
  healthBucketDotClass,
} from "@/lib/platform-admin/executive-dashboard-ui";
import {
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

const TESTING_BASE = `${PLATFORM_ADMIN_BASE_PATH}/testing`;

function HeroStat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-aistroyka-surface-raised/80 px-aistroyka-4 py-aistroyka-4 sm:min-w-[7.5rem]">
      <p className="text-aistroyka-caption font-medium uppercase tracking-wider text-aistroyka-text-tertiary">
        {label}
      </p>
      <p
        className="mt-aistroyka-2 truncate text-aistroyka-title3 font-semibold text-aistroyka-text-primary"
        title={title ?? value}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  headingId,
  title,
  subtitle,
}: {
  headingId: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-aistroyka-1">
      <h2
        id={headingId}
        className="text-aistroyka-headline font-semibold tracking-tight text-aistroyka-text-primary"
      >
        {title}
      </h2>
      {subtitle ? <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">{subtitle}</p> : null}
    </div>
  );
}

function HealthTile({
  label,
  statusLabel,
  status,
  bucket,
}: {
  label: string;
  statusLabel: string;
  status: QualityStatus;
  bucket: HealthBucket;
}) {
  return (
    <div className="flex items-center gap-aistroyka-3 rounded-2xl bg-aistroyka-surface-raised/60 px-aistroyka-4 py-aistroyka-3">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthBucketDotClass(bucket)}`}
        aria-hidden
      />
      <p className="min-w-0 flex-1 font-medium text-aistroyka-text-primary">{label}</p>
      <Badge variant={qualityStatusBadgeVariant(status)} className="shrink-0">
        {statusLabel}
      </Badge>
    </div>
  );
}

export function PlatformAdminTestingClient({ dashboard, intelligence, recentAudits }: Props) {
  const d = dashboard;
  const intel = intelligence;
  const summary = intel.ownerSummary;

  const healthCards = useMemo(() => buildPlatformHealthCards(d), [d]);
  const actions = useMemo(() => buildPrioritizedActions(intel, TESTING_BASE), [intel]);
  const impactGroups = useMemo(() => groupBusinessImpact(intel.affectedProductAreas), [intel.affectedProductAreas]);
  const timeline = useMemo(
    () => buildRecentChangesTimeline(d, intel, recentAudits),
    [d, intel, recentAudits]
  );
  const releaseWhy = useMemo(() => buildPlainEnglishReleaseWhy(intel), [intel]);
  const nextActionDisplay = truncateAction(summary.nextSafeAction);
  const lastRefreshLabel = formatTimelineTime(d.dataCoverage.lastRefresh);

  return (
    <section className="space-y-aistroyka-10 pb-aistroyka-8" aria-label="Operations Center">
      <header className="space-y-aistroyka-5">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-3">
          <h1 className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary">
            Operations Center
          </h1>
          <Badge variant="neutral" className="shrink-0">
            Read-only
          </Badge>
        </div>

        <div
          className={`rounded-2xl bg-gradient-to-br from-aistroyka-surface-raised to-aistroyka-surface p-aistroyka-5 sm:p-aistroyka-6 ${releaseDecisionBorderClass(intel.releaseDecision)}`}
        >
          <div className="flex flex-wrap gap-aistroyka-3">
            <HeroStat label="Platform status" value={d.platformStatus.overallHealthLabel} />
            <HeroStat label="Release status" value={summary.releaseDecisionLabel} />
            <HeroStat label="Confidence" value={summary.confidenceLabel} />
            <HeroStat label="Release blockers" value={String(summary.criticalBlockersCount)} />
            <HeroStat label="Warnings" value={String(summary.warningCount)} />
            <HeroStat label="Last audit" value={formatLastAuditLabel(recentAudits)} />
            <HeroStat label="Last refresh" value={lastRefreshLabel} />
            <HeroStat
              label="Next action"
              value={nextActionDisplay}
              title={summary.nextSafeAction}
            />
          </div>
        </div>
      </header>

      <section aria-labelledby="platform-overview-heading" className="space-y-aistroyka-4">
        <SectionHeading
          headingId="platform-overview-heading"
          title="Platform overview"
          subtitle="Live counts from existing platform services — unknown when evidence is missing."
        />
        <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewStat label="Tenants" value={formatOverviewCount(d.platformOverview.totalTenants)} />
          <OverviewStat label="Active users" value={formatOverviewCount(d.platformOverview.activeUsers)} />
          <OverviewStat label="Projects" value={formatOverviewCount(d.platformOverview.totalProjects)} />
          <OverviewStat label="Open support" value={formatOverviewCount(d.platformOverview.openSupportEvents)} />
          <OverviewStat label="Pending invites" value={formatOverviewCount(d.platformOverview.pendingInvites)} />
          <OverviewStat label="Push pending" value={formatOverviewCount(d.platformOverview.pushPending)} />
          <OverviewStat label="Push failed" value={formatOverviewCount(d.platformOverview.pushFailed)} />
          <OverviewStat
            label="Entitlements rows"
            value={formatOverviewCount(d.platformOverview.entitlementsRows)}
          />
        </div>
        <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">{d.platformOverview.summary}</p>
      </section>

      <section aria-labelledby="next-actions-heading" className="space-y-aistroyka-4">
        <SectionHeading
          headingId="next-actions-heading"
          title="Next actions"
          subtitle="Up to five safe steps — prioritized from live evidence."
        />
        <ol className="space-y-aistroyka-3">
          {actions.map((action) => (
            <li key={`${action.priority}-${action.title}`}>
              {action.href ? (
                <Link
                  href={action.href}
                  className="group block rounded-2xl bg-aistroyka-surface-raised/80 px-aistroyka-5 py-aistroyka-4 transition-colors hover:bg-aistroyka-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aistroyka-accent"
                >
                  <ActionRow action={action} linked />
                </Link>
              ) : (
                <div className="rounded-2xl bg-aistroyka-surface-raised/80 px-aistroyka-5 py-aistroyka-4">
                  <ActionRow action={action} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section
        id="release-center"
        aria-labelledby="release-center-heading"
        className={`space-y-aistroyka-4 rounded-2xl p-aistroyka-6 sm:p-aistroyka-8 ${releaseDecisionBorderClass(intel.releaseDecision)} bg-aistroyka-surface-raised/50`}
      >
        <SectionHeading
          headingId="release-center-heading"
          title="Release center"
          subtitle="Why this release posture — in plain language."
        />
        <div className="flex flex-wrap items-center gap-aistroyka-4">
          <p className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
            {summary.releaseDecisionLabel}
          </p>
          <Badge variant={releaseDecisionBadgeVariant(intel.releaseDecision)} className="text-sm px-aistroyka-3 py-aistroyka-1">
            Readiness {summary.readinessScoreLabel}
          </Badge>
        </div>
        <ul className="max-w-3xl space-y-aistroyka-2">
          {releaseWhy.map((line) => (
            <li key={line} className="text-aistroyka-subheadline leading-relaxed text-aistroyka-text-secondary">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="platform-health-heading" className="space-y-aistroyka-4">
        <SectionHeading
          headingId="platform-health-heading"
          title="Platform health"
          subtitle="Sorted by urgency — critical first."
        />
        <div className="grid gap-aistroyka-3 sm:grid-cols-2 xl:grid-cols-3">
          {healthCards.map((card) => (
            <HealthTile
              key={card.id}
              label={card.label}
              statusLabel={card.statusLabel}
              status={card.status}
              bucket={card.bucket}
            />
          ))}
        </div>
      </section>

      <section id="business-impact" aria-labelledby="business-impact-heading" className="space-y-aistroyka-4">
        <SectionHeading
          headingId="business-impact-heading"
          title="Business impact"
          subtitle="Largest impact first — healthy areas collapsed."
        />
        {impactGroups.affected.length > 0 ? (
          <div className="grid gap-aistroyka-3 sm:grid-cols-2">
            {impactGroups.affected.map((area) => (
              <ImpactCard key={area.id} area={area} emphasized />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-aistroyka-surface-raised/60 px-aistroyka-5 py-aistroyka-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
            No business areas show confirmed impact from live checks.
          </p>
        )}
        {impactGroups.unknown.length > 0 ? (
          <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
            {impactGroups.unknown.map((area) => (
              <ImpactCard key={area.id} area={area} />
            ))}
          </div>
        ) : null}
        {impactGroups.healthy.length > 0 ? (
          <details className="rounded-2xl bg-aistroyka-surface-raised/40 px-aistroyka-4 py-aistroyka-3">
            <summary className="cursor-pointer text-aistroyka-footnote font-medium text-aistroyka-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aistroyka-accent">
              {impactGroups.healthy.length} healthy areas (no impact detected)
            </summary>
            <ul className="mt-aistroyka-3 flex flex-wrap gap-aistroyka-2">
              {impactGroups.healthy.map((area) => (
                <li
                  key={area.id}
                  className="rounded-full bg-aistroyka-surface px-aistroyka-3 py-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary"
                >
                  {area.label}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section id="recent-changes" aria-labelledby="recent-changes-heading" className="space-y-aistroyka-4">
        <SectionHeading
          headingId="recent-changes-heading"
          title="Recent activity"
          subtitle="Latest platform refresh, saved audits, and evidence signals."
        />
        <ol className="relative space-y-0 border-l border-aistroyka-border-subtle pl-aistroyka-6">
          {timeline.map((entry, index) => (
            <li key={entry.id} className={`relative pb-aistroyka-5 ${index === timeline.length - 1 ? "pb-0" : ""}`}>
              <span
                className="absolute -left-[1.625rem] top-1.5 h-2.5 w-2.5 rounded-full bg-aistroyka-accent"
                aria-hidden
              />
              <p className="text-aistroyka-caption font-medium tabular-nums text-aistroyka-text-tertiary">
                {entry.timeLabel}
              </p>
              <p className="mt-aistroyka-1 text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                {entry.title}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section id="decision-confidence" aria-labelledby="confidence-heading" className="space-y-aistroyka-4">
        <SectionHeading headingId="confidence-heading" title="Decision confidence" />
        <div className="flex flex-wrap items-end gap-aistroyka-4 rounded-2xl bg-aistroyka-surface-raised/60 px-aistroyka-5 py-aistroyka-5">
          <div>
            <p className="text-aistroyka-caption uppercase tracking-wider text-aistroyka-text-tertiary">Level</p>
            <p className="mt-aistroyka-1 text-aistroyka-title2 font-bold text-aistroyka-text-primary">
              {summary.confidenceLabel}
            </p>
          </div>
          <div>
            <p className="text-aistroyka-caption uppercase tracking-wider text-aistroyka-text-tertiary">Score</p>
            <p className="mt-aistroyka-1 text-aistroyka-title2 font-bold text-aistroyka-text-primary">
              {formatPercent(summary.evidenceCoveragePercent)}
            </p>
          </div>
          <Badge variant={confidenceBadgeVariant(intel.confidenceScore)} className="mb-1">
            {d.dataCoverage.connectedCount} of {d.dataCoverage.totalCatalogCount} live sources
          </Badge>
        </div>
        <details className="rounded-2xl bg-aistroyka-surface-raised/40 px-aistroyka-4 py-aistroyka-3">
          <summary className="cursor-pointer text-aistroyka-footnote font-medium text-aistroyka-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aistroyka-accent">
            Coverage notes
          </summary>
          <p className="mt-aistroyka-3 text-aistroyka-footnote text-aistroyka-text-secondary">{intel.coverageExplanation}</p>
          {intel.coverageBlindSpots.length > 0 ? (
            <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
              {intel.coverageBlindSpots.slice(0, 8).map((spot) => (
                <li key={spot}>{spot}</li>
              ))}
            </ul>
          ) : null}
        </details>
      </section>

      <section aria-labelledby="technical-diagnostics-heading" className="space-y-aistroyka-4 border-t border-aistroyka-border-subtle pt-aistroyka-8">
        <SectionHeading
          headingId="technical-diagnostics-heading"
          title="Technical diagnostics"
          subtitle="For engineers — probes, evidence, and build metadata."
        />
        <details className="rounded-2xl bg-aistroyka-surface-raised/40 px-aistroyka-4 py-aistroyka-3">
          <summary className="cursor-pointer font-medium text-aistroyka-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aistroyka-accent">
            Expand technical diagnostics
          </summary>
          <div className="mt-aistroyka-5 space-y-aistroyka-6">
            <dl className="grid gap-aistroyka-3 text-aistroyka-footnote sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-aistroyka-text-tertiary">Build SHA</dt>
                <dd className="font-mono text-aistroyka-text-secondary">{formatDeployShaForDiagnostics(d)}</dd>
              </div>
              <div>
                <dt className="text-aistroyka-text-tertiary">Environment</dt>
                <dd className="text-aistroyka-text-secondary">{summary.environment}</dd>
              </div>
              <div>
                <dt className="text-aistroyka-text-tertiary">Generated</dt>
                <dd className="text-aistroyka-text-secondary">{formatTimestamp(d.generatedAt)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Domain overview</h3>
              <div className="mt-aistroyka-3 grid gap-aistroyka-2 sm:grid-cols-2 lg:grid-cols-3">
                {d.domainSections.map((section) => (
                  <div key={section.id} className="rounded-xl bg-aistroyka-surface px-aistroyka-3 py-aistroyka-2">
                    <div className="flex items-center justify-between gap-aistroyka-2">
                      <span className="font-medium text-aistroyka-text-primary">{section.label}</span>
                      <Badge variant={qualityStatusBadgeVariant(section.status)}>{section.statusLabel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Connected sources</h3>
              <ul className="mt-aistroyka-2 space-y-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">
                {d.dataCoverage.available.map((source) => (
                  <li key={source.id}>
                    {source.label} — {source.summary}
                  </li>
                ))}
              </ul>
            </div>

            {intel.decisionReasons.length > 0 ? (
              <div>
                <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Evidence detail</h3>
                <ul className="mt-aistroyka-3 space-y-aistroyka-3">
                  {intel.decisionReasons.map((reason) => (
                    <li key={`${reason.component}-${reason.title}`} className="rounded-xl bg-aistroyka-surface px-aistroyka-3 py-aistroyka-2 text-aistroyka-footnote">
                      <p className="font-medium text-aistroyka-text-primary">{reason.title}</p>
                      <p className="mt-aistroyka-1 text-aistroyka-text-tertiary">{reason.evidence}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      </section>
    </section>
  );
}

function ActionRow({ action, linked }: { action: ExecutiveAction; linked?: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-aistroyka-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aistroyka-accent/15 text-aistroyka-footnote font-bold text-aistroyka-accent">
        {action.priority}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-aistroyka-subheadline font-semibold text-aistroyka-text-primary ${linked ? "group-hover:text-aistroyka-accent" : ""}`}>
          {action.title}
        </p>
        <div className="mt-aistroyka-2 flex flex-wrap gap-x-aistroyka-4 gap-y-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          <span>Estimated effort: {action.effort}</span>
          <span>Business impact: {action.businessImpact}</span>
        </div>
        {action.note ? (
          <p className="mt-aistroyka-2 text-aistroyka-footnote font-medium text-aistroyka-accent">{action.note}</p>
        ) : null}
      </div>
    </div>
  );
}

function ImpactCard({ area, emphasized }: { area: ProductAreaImpact; emphasized?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-aistroyka-4 py-aistroyka-4 ${
        emphasized ? "bg-aistroyka-surface-raised ring-1 ring-amber-500/20" : "bg-aistroyka-surface-raised/60"
      }`}
    >
      <div className="flex items-center justify-between gap-aistroyka-2">
        <p className="font-semibold text-aistroyka-text-primary">{area.label}</p>
        <Badge variant={productAreaBadgeVariant(area.status)}>{productAreaStatusLabel(area.status)}</Badge>
      </div>
      {area.evidence ? (
        <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">{area.evidence}</p>
      ) : null}
    </div>
  );
}

function truncateAction(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatOverviewCount(value: number | null): string {
  if (value === null) return "Unknown";
  return String(value);
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-aistroyka-surface-raised/60 px-aistroyka-4 py-aistroyka-3">
      <p className="text-aistroyka-caption font-medium uppercase tracking-wider text-aistroyka-text-tertiary">
        {label}
      </p>
      <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{value}</p>
    </div>
  );
}
