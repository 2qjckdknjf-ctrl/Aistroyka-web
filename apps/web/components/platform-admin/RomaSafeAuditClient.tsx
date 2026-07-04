import { Card, Badge } from "@/components/ui";
import type { RomaSafeReadonlyAudit } from "@/lib/platform-admin/roma-safe-readonly-audit.types";
import {
  getReadonlyAuditLimitations,
  getSafeReadonlyAuditMeta,
  summarizeReadonlyAudit,
} from "@/lib/platform-admin/roma-safe-readonly-audit";

type Props = {
  audit: RomaSafeReadonlyAudit;
};

function statusVariant(status: RomaSafeReadonlyAudit["status"]): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "pass":
      return "success";
    case "degraded":
      return "warning";
    case "fail":
      return "danger";
    case "unknown":
      return "neutral";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function RomaSafeAuditClient({ audit }: Props) {
  const meta = getSafeReadonlyAuditMeta();
  const limitations = getReadonlyAuditLimitations();

  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Safe Readonly Audit">
      <Card className="p-aistroyka-5 border-aistroyka-border-warning bg-aistroyka-surface-raised">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Safety notice</h2>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          This page runs a <strong>read-only audit</strong> on load using safe server probes. It does{" "}
          <strong>not</strong> execute catalog tests, trigger CI, deploy, mutate production, or write to the database.
          No Run button in V1 — snapshot refreshes on page reload only.
        </p>
      </Card>

      <Card className="p-aistroyka-5">
        <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
          <div>
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
              Safe Readonly Audit
            </h1>
            <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
              First real ROMA audit runner — collects live evidence from allowed read-only sources and produces
              findings and release recommendations. Owner-only platform-admin surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-aistroyka-2">
            <Badge variant={statusVariant(audit.status)}>Status: {audit.status}</Badge>
            <Badge variant="neutral">{audit.mode}</Badge>
            <Badge variant="neutral">v1</Badge>
          </div>
        </div>
        <p className="mt-aistroyka-4 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
          {audit.auditId} · {audit.createdAt}
        </p>
        <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">
          {summarizeReadonlyAudit(audit)}
        </p>
        <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Catalog execution enabled: {String(meta.executionEnabled)} · Audit execution enabled:{" "}
          {String(audit.executionEnabled)}
        </p>
      </Card>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">What this audit checks</h2>
        <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-2 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
          {audit.allowedSources.map((source) => (
            <li key={source}>{source.replace(/_/g, " ")}</li>
          ))}
        </ul>
        <p className="mt-aistroyka-4 text-aistroyka-caption text-aistroyka-text-tertiary">
          Forbidden: {audit.forbiddenActions.join(", ")}
        </p>
      </Card>

      <div className="grid gap-aistroyka-5 lg:grid-cols-2">
        <Card className="p-aistroyka-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Release recommendation</h2>
          <p className="mt-aistroyka-3 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {audit.releaseRecommendationLabel}
          </p>
          <p className="mt-aistroyka-2 text-aistroyka-footnote text-aistroyka-text-secondary">
            Confidence: {audit.confidence}
            {audit.confidencePercent != null ? ` (${audit.confidencePercent}%)` : ""}
          </p>
        </Card>
        <Card className="p-aistroyka-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Limitations</h2>
          <ul className="mt-aistroyka-3 list-disc space-y-aistroyka-2 pl-aistroyka-5 text-aistroyka-footnote text-aistroyka-text-secondary">
            {limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-aistroyka-5">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          Evidence ({audit.evidence.length})
        </h2>
        <div className="mt-aistroyka-4 space-y-aistroyka-2">
          {audit.evidence.map((item) => (
            <div
              key={item.sourceId}
              className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3"
            >
              <div className="flex flex-wrap items-center gap-aistroyka-2">
                <p className="font-medium text-aistroyka-text-primary">{item.label}</p>
                <Badge variant="neutral">{item.status}</Badge>
              </div>
              <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">{item.summary}</p>
              {item.detail ? (
                <p className="mt-aistroyka-1 font-mono text-aistroyka-caption text-aistroyka-text-tertiary">
                  {item.detail}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-aistroyka-5 lg:grid-cols-2">
        <Card className="p-aistroyka-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            Findings ({audit.findings.length})
          </h2>
          <ul className="mt-aistroyka-3 space-y-aistroyka-2 text-aistroyka-footnote">
            {audit.findings.length > 0 ? (
              audit.findings.map((f) => (
                <li key={f.id} className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2">
                  <span className="font-medium text-aistroyka-text-primary">{f.title}</span>
                  <span className="text-aistroyka-text-tertiary"> · {f.severity}</span>
                  <p className="mt-aistroyka-1 text-aistroyka-text-secondary">{f.evidence}</p>
                </li>
              ))
            ) : (
              <li className="text-aistroyka-text-tertiary">No findings from current evidence.</li>
            )}
          </ul>
        </Card>
        <Card className="p-aistroyka-5">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            Recommendations ({audit.recommendations.length})
          </h2>
          <ul className="mt-aistroyka-3 space-y-aistroyka-2 text-aistroyka-footnote">
            {audit.recommendations.length > 0 ? (
              audit.recommendations.map((r) => (
                <li key={r.id} className="rounded-card border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2">
                  <span className="font-medium text-aistroyka-text-primary">{r.title}</span>
                  <p className="mt-aistroyka-1 text-aistroyka-text-secondary">{r.evidence}</p>
                </li>
              ))
            ) : (
              <li className="text-aistroyka-text-tertiary">No recommendations — evidence looks healthy.</li>
            )}
          </ul>
        </Card>
      </div>
    </section>
  );
}
