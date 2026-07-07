"use client";

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

function HeroStat({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-aistroyka-surface-raised/80 px-aistroyka-4 py-aistroyka-4 sm:min-w-[7.5rem]">
      <p className="text-aistroyka-caption font-medium uppercase tracking-wider text-aistroyka-text-tertiary">
        {label}
      </p>
      <p
        className={`mt-aistroyka-2 truncate font-semibold text-aistroyka-text-primary ${
          large ? "text-aistroyka-title2 sm:text-aistroyka-title" : "text-aistroyka-title3"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ id, title, subtitle }: { id?: string; title: string; subtitle?: string }) {
  return (
    <div id={id} className="space-y-aistroyka-1">
      <h2 className="text-aistroyka-headline font-semibold tracking-tight text-aistroyka-text-primary">{title}</h2>
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
      <div className="min-w-0 flex-1">
        <p className="font-medium text-aistroyka-text-primary">{label}</p>
        <p className="text-aistroyka-footnote text-aistroyka-text-tertiary">{statusLabel}</p>
      </div>
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

  const healthCards = buildPlatformHealthCards(d);
  const actions = buildPrioritizedActions(intel, TESTING_BASE);
  const impactGroups = groupBusinessImpact(intel.affectedProductAreas);
  const timeline = buildRecentChangesTimeline(d, intel, recentAudits);
  const releaseWhy = buildPlainEnglishReleaseWhy(intel);

  return (
    <section className="space-y-aistroyka-10 pb-aistroyka-8" aria-label="Executive operations center">
      {/* 1 — Executive Hero */}
      <header className="space-y-aistroyka-5">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-3">
          <h1 className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary sm:text-[1.75rem]">
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
            <HeroStat label="Platform status" value={d.platformStatus.overallHealthLabel} large />
            <HeroStat label="Release status" value={summary.releaseDecisionLabel} large />
            <HeroStat label="Confidence" value={summary.confidenceLabel} />
            <HeroStat label="Release blockers" value={String(summary.criticalBlockersCount)} />
            <HeroStat label="Warnings" value={String(summary.warningCount)} />
            <HeroStat label="Last audit" value={formatLastAuditLabel(recentAudits)} />
            <HeroStat label="Last refresh" value={formatTimelineShort(d.dataCoverage.lastRefresh)} />
            <HeroStat label="Next action" value={truncateAction(summary.nextSafeAction)} />
          </div>
        </div>
      </header>

      {/* 2 — Next Actions */}
      <section aria-labelledby="next-actions-heading" className="space-y-aistroyka-4">
        <SectionHeading
          id="next-actions"
          title="Next actions"
          subtitle="ROMA-prioritized — maximum five items, safe owner workflows only."
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

      {/* 3 — Release Center */}
      <section
        id="release-center"
        aria-labelledby="release-center-heading"
        className={`space-y-aistroyka-4 rounded-2xl p-aistroyka-6 sm:p-aistroyka-8 ${releaseDecisionBorderClass(intel.releaseDecision)} bg-aistroyka-surface-raised/50`}
      >
        <SectionHeading
          title="Release center"
          subtitle="Why ROMA recommends this release posture — plain language."
        />
        <div className="flex flex-wrap items-center gap-aistroyka-4">
          <p
            id="release-center-heading"
            className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary sm:text-[2rem]"
          >
            {summary.releaseDecisionLabel}
          </p>
          <Badge variant={releaseDecisionBadgeVariant(intel.releaseDecision)} className="text-sm px-aistroyka-3 py-aistroyka-1">
            {summary.readinessScoreLabel}
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

      {/* 4 — Platform Health */}
      <section aria-labelledby="platform-health-heading" className="space-y-aistroyka-4">
        <SectionHeading title="Platform health" subtitle="Sorted by urgency — critical first." />
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

      {/* 5 — Business Impact */}
      <section id="business-impact" aria-labelledby="business-impact-heading" className="space-y-aistroyka-4">
        <SectionHeading title="Business impact" subtitle="Largest impact first — healthy areas collapsed." />
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

      {/* 6 — Recent Changes */}
      <section id="recent-changes" aria-labelledby="recent-changes-heading" className="space-y-aistroyka-4">
        <SectionHeading title="Recent changes" subtitle="What changed since your last visit." />
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

      {/* 7 — Decision Confidence */}
      <section id="decision-confidence" aria-labelledby="confidence-heading" className="space-y-aistroyka-4">
        <SectionHeading title="Decision confidence" />
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
            Blind spots &amp; coverage notes
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

      {/* 8 — Technical Diagnostics */}
      <section aria-labelledby="technical-diagnostics-heading" className="space-y-aistroyka-4 border-t border-aistroyka-border-subtle pt-aistroyka-8">
        <SectionHeading
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

function formatTimelineShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function truncateAction(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
