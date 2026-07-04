import { Card, Badge } from "@/components/ui";
import type { RomaAuditRunListItem } from "@/lib/platform-admin/roma-run-history.types";
import { ROMA_AUDIT_RUN_HISTORY_META } from "@/lib/platform-admin/roma-run-history.service";

type Props = {
  runs: readonly RomaAuditRunListItem[];
  loadError?: string | null;
};

function statusVariant(status: RomaAuditRunListItem["status"]): "success" | "warning" | "danger" | "neutral" {
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

export function RomaAuditRunsClient({ runs, loadError }: Props) {
  return (
    <section className="space-y-aistroyka-5" aria-label="ROMA Audit Run History">
      <Card className="p-aistroyka-5">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary">
          Audit Run History
        </h1>
        <p className="mt-aistroyka-2 max-w-3xl text-aistroyka-subheadline text-aistroyka-text-secondary">
          Saved Safe Readonly Audit snapshots — append-only, redacted evidence. Use{" "}
          <strong>Save Snapshot</strong> on the Safe Audit page to persist a run. No auto-save, no compare/export in
          V1.
        </p>
        <p className="mt-aistroyka-3 text-aistroyka-footnote text-aistroyka-text-tertiary">
          Showing latest {ROMA_AUDIT_RUN_HISTORY_META.listLimit} runs · Auto-save:{" "}
          {String(ROMA_AUDIT_RUN_HISTORY_META.autoSaveEnabled)}
        </p>
      </Card>

      {loadError ? (
        <Card className="p-aistroyka-5">
          <p className="text-aistroyka-footnote text-aistroyka-error" role="alert">
            {loadError}
          </p>
        </Card>
      ) : null}

      {runs.length === 0 ? (
        <Card className="p-aistroyka-5">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            No saved audit runs yet. Open Safe Audit and click Save Snapshot to store a redacted run.
          </p>
        </Card>
      ) : (
        <div className="space-y-aistroyka-3">
          {runs.map((run) => (
            <Card key={run.id} className="p-aistroyka-5">
              <div className="flex flex-wrap items-start justify-between gap-aistroyka-3">
                <div>
                  <p className="font-mono text-aistroyka-caption text-aistroyka-text-tertiary">{run.id}</p>
                  <p className="mt-aistroyka-1 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
                    <time dateTime={run.createdAt}>{run.createdAt}</time>
                  </p>
                </div>
                <div className="flex flex-wrap gap-aistroyka-2">
                  <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                  <Badge variant="neutral">{run.releaseRecommendation}</Badge>
                  <Badge variant="neutral">{run.confidence}</Badge>
                </div>
              </div>

              <dl className="mt-aistroyka-4 grid gap-aistroyka-3 sm:grid-cols-2 lg:grid-cols-4 text-aistroyka-footnote">
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Environment</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-primary">{run.environment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Coverage</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-primary">
                    {run.coveragePercent != null ? `${run.coveragePercent}%` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Critical / Warning</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-primary">
                    {run.criticalCount} / {run.warningCount}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-aistroyka-text-tertiary">Build SHA</dt>
                  <dd className="mt-aistroyka-1 font-mono text-aistroyka-text-primary">{run.buildSha ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-aistroyka-text-tertiary">Retention until</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-primary">
                    <time dateTime={run.retentionUntil}>{run.retentionUntil}</time>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-aistroyka-text-tertiary">Findings (summary)</dt>
                  <dd className="mt-aistroyka-1 text-aistroyka-text-secondary">
                    {run.findingsSummary.items.length > 0
                      ? run.findingsSummary.items.map((f) => f.title).join("; ")
                      : "None"}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
