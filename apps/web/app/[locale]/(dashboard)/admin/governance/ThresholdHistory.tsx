import { Card } from "@/components/ui";
import { EmptyState } from "@/components/ui";

type Row = {
  id: string;
  created_at: string;
  calibration_version: string;
  thresholds: Record<string, number>;
  thresholds_smoothed: Record<string, number>;
  smoothing_alpha: number | null;
  delta_stats: Record<string, { absolute: number; relative: number }>;
};

export function ThresholdHistory({ history }: { history: Row[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={
            <svg className="h-aistroyka-empty-icon w-aistroyka-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="No threshold history"
          subtitle="Threshold history will appear after the daily pipeline runs with calibration."
        />
      </Card>
    );
  }

  const keys = Array.from(
    new Set(history.flatMap((r) => Object.keys(r.thresholds_smoothed ?? r.thresholds ?? {})))
  ).filter(Boolean);
  const keyLabel = keys.length ? keys[0] : "risk_jump_threshold";

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-aistroyka-subheadline">
          <thead>
            <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
              <th className="table-cell font-semibold text-aistroyka-text-primary p-aistroyka-3">Date</th>
              <th className="table-cell font-semibold text-aistroyka-text-primary p-aistroyka-3">Version</th>
              <th className="table-cell font-semibold text-aistroyka-text-primary p-aistroyka-3">α</th>
              {keys.map((k) => (
                <th key={k} className="table-cell font-semibold text-aistroyka-text-primary p-aistroyka-3">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id} className="border-b border-aistroyka-border-subtle last:border-0 hover:bg-aistroyka-surface-raised/50">
                <td className="table-cell text-aistroyka-text-secondary p-aistroyka-3 tabular-nums">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
                <td className="table-cell text-aistroyka-text-secondary p-aistroyka-3">{row.calibration_version}</td>
                <td className="table-cell text-aistroyka-text-secondary p-aistroyka-3">{row.smoothing_alpha?.toFixed(2) ?? "—"}</td>
                {keys.map((k) => {
                  const v = (row.thresholds_smoothed ?? row.thresholds)?.[k];
                  const delta = row.delta_stats?.[k];
                  return (
                    <td key={k} className="table-cell p-aistroyka-3">
                      <span className="font-medium text-aistroyka-text-primary">{v != null ? (typeof v === "number" ? v.toFixed(2) : String(v)) : "—"}</span>
                      {delta && delta.absolute !== 0 && (
                        <span className="ml-1 text-aistroyka-caption text-aistroyka-text-tertiary">
                          ({delta.absolute > 0 ? "+" : ""}{delta.absolute.toFixed(2)})
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {keyLabel && (
        <p className="p-aistroyka-3 text-aistroyka-caption text-aistroyka-text-tertiary">
          Key threshold for trend: <strong>{keyLabel}</strong>. Last 5 calibrations.
        </p>
      )}
    </Card>
  );
}
