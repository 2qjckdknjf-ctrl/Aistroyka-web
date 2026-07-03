"use client";

import { Card, Badge } from "@/components/ui";
import { PLATFORM_ADMIN_BASE_PATH, PLATFORM_ADMIN_PREFERRED_HOST } from "@/lib/platform-admin/constants";
import type { RomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.types";
import {
  blockerSeverityBadgeVariant,
  formatPercent,
  formatTimestamp,
  qualityStatusBadgeVariant,
  readinessBadgeVariant,
} from "@/lib/platform-admin/quality-dashboard-ui";

type Props = {
  dashboard: RomaQualityDashboard;
};

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3">
      <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
        {label}
      </p>
      <p className="mt-aistroyka-1 text-aistroyka-headline font-semibold text-aistroyka-text-primary">{value}</p>
      {hint ? <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">{hint}</p> : null}
    </div>
  );
}

export function PlatformAdminTestingClient({ dashboard }: Props) {
  const d = dashboard;
  const criticalCount = d.blockers.filter((b) => b.severity === "critical").length;
  const warningCount = d.blockers.filter((b) => b.severity === "warning").length;

  return (
    <section className="space-y-aistroyka-6" aria-label="ROMA quality control center">
      <Card className="border-l-4 border-l-aistroyka-accent p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
              ROMA Quality Control Center
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              Live platform quality dashboard — read-only. Test execution, CI orchestration, and production
              mutation are not enabled from this surface. Tenant company admins cannot access this page.
            </p>
          </div>
          <Badge variant="neutral">Read-only</Badge>
        </div>
        <p className="mt-aistroyka-3 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Preferred admin host{" "}
          <code className="rounded bg-aistroyka-surface-raised px-1">{PLATFORM_ADMIN_PREFERRED_HOST}</code>{" "}
          is pending deployment. Active route:{" "}
          <code className="rounded bg-aistroyka-surface-raised px-1">
            /[locale]{PLATFORM_ADMIN_BASE_PATH}/testing
          </code>
          . ROMA cannot mutate production from here.
        </p>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Platform status</h2>
        <div className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Overall health"
            value={d.platformStatus.overallHealthLabel}
            hint={`Probe status: ${d.platformStatus.overallHealth}`}
          />
          <MetricTile
            label="Release readiness"
            value={formatPercent(d.platformStatus.releaseReadinessPercent)}
            hint={`Level: ${d.platformStatus.releaseReadiness}`}
          />
          <MetricTile label="Last updated" value={formatTimestamp(d.platformStatus.lastUpdated)} />
          <MetricTile
            label="Environment"
            value={d.environment.label}
            hint={d.environment.appUrl ?? "App URL not configured"}
          />
        </div>
      </Card>

      <div>
        <h2 className="mb-aistroyka-3 text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          System components
        </h2>
        <div className="grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
          {d.systemComponents.map((component) => (
            <Card key={component.id} className="p-aistroyka-4">
              <div className="flex items-center justify-between gap-aistroyka-2">
                <h3 className="font-semibold text-aistroyka-text-primary">{component.name}</h3>
                <Badge variant={qualityStatusBadgeVariant(component.status)}>{component.statusLabel}</Badge>
              </div>
              <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-tertiary">
                Last check: {formatTimestamp(component.lastCheck)}
              </p>
              <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
                {component.details}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-2">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Release readiness</h2>
          <Badge variant={readinessBadgeVariant(d.platformStatus.releaseReadiness)}>
            Overall {formatPercent(d.platformStatus.releaseReadinessPercent)}
          </Badge>
        </div>
        <div className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-4">
          {d.releaseReadiness.map((category) => (
            <div
              key={category.id}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
            >
              <div className="flex items-center justify-between gap-aistroyka-2">
                <p className="font-medium text-aistroyka-text-primary">{category.label}</p>
                <Badge variant={readinessBadgeVariant(category.level)}>{formatPercent(category.percent)}</Badge>
              </div>
              <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">
                {category.summary}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-center gap-aistroyka-2">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Current blockers</h2>
          {criticalCount > 0 ? (
            <Badge variant="danger">{criticalCount} critical</Badge>
          ) : null}
          {warningCount > 0 ? (
            <Badge variant="warning">{warningCount} warnings</Badge>
          ) : null}
        </div>
        <ul className="mt-aistroyka-4 space-y-aistroyka-3">
          {d.blockers.map((blocker) => (
            <li
              key={`${blocker.component}-${blocker.title}`}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
            >
              <div className="flex flex-wrap items-center gap-aistroyka-2">
                <p className="font-medium text-aistroyka-text-primary">{blocker.title}</p>
                <Badge variant={blockerSeverityBadgeVariant(blocker.severity)}>{blocker.severity}</Badge>
                <span className="text-aistroyka-caption text-aistroyka-text-tertiary">{blocker.component}</span>
              </div>
              <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
                {blocker.recommendation}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Latest changes</h2>
        <dl className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Last deployment</dt>
            <dd className="font-medium text-aistroyka-text-primary">
              {formatTimestamp(d.latestChanges.lastDeploy)}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Last commit</dt>
            <dd className="font-mono font-medium text-aistroyka-text-primary">
              {d.latestChanges.lastCommit ?? "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Branch</dt>
            <dd className="font-medium text-aistroyka-text-primary">{d.latestChanges.branch ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Build</dt>
            <dd className="font-mono font-medium text-aistroyka-text-primary">
              {d.latestChanges.build ?? "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Timestamp</dt>
            <dd className="font-medium text-aistroyka-text-primary">
              {formatTimestamp(d.latestChanges.timestamp)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">ROMA status</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Maturity indicators from live probes and configuration — execution remains disabled.
        </p>
        <div className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-3">
          {d.romaStatus.map((item) => (
            <div
              key={item.id}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
            >
              <div className="flex items-center justify-between gap-aistroyka-2">
                <p className="font-medium text-aistroyka-text-primary">{item.label}</p>
                <Badge variant={readinessBadgeVariant(item.level)}>{item.level}</Badge>
              </div>
              <p className="mt-aistroyka-1 text-aistroyka-caption text-aistroyka-text-tertiary">
                Source: {item.source.replace("_", " ")}
              </p>
              <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Known reports</h2>
        <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Repository audit references. In-app doc routes are not configured — paths shown for operator traceability.
        </p>
        <ul className="mt-aistroyka-4 space-y-aistroyka-3">
          {d.knownReports.map((report) => (
            <li
              key={report.path}
              className="rounded-card border border-aistroyka-border-subtle px-aistroyka-4 py-aistroyka-3"
            >
              {report.href ? (
                <a href={report.href} className="font-medium text-aistroyka-accent hover:underline">
                  {report.label}
                </a>
              ) : (
                <p className="font-medium text-aistroyka-text-primary">{report.label}</p>
              )}
              <p className="font-mono text-aistroyka-caption text-aistroyka-text-tertiary">{report.path}</p>
              <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
                {report.note}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border border-dashed border-aistroyka-border-subtle p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Data sources</h2>
        <div className="mt-aistroyka-4 grid gap-aistroyka-4 lg:grid-cols-2">
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">Available</p>
            <ul className="mt-aistroyka-2 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
              {d.dataSources.available.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">
              Unavailable
            </p>
            <ul className="mt-aistroyka-2 list-disc space-y-aistroyka-1 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
              {d.dataSources.unavailable.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </section>
  );
}
