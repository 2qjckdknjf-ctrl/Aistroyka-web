import {
  computeIntelligenceMetrics,
  type AnalysisSnapshot,
} from "@/lib/intelligence/metrics";

export function IntelligenceSummary({
  history,
}: {
  history: AnalysisSnapshot[];
}) {
  const metrics = computeIntelligenceMetrics(history);

  if (history.length === 0) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        No completed analyses yet. Upload images and run analysis to see intelligence.
      </div>
    );
  }

  if (!metrics.hasEnoughHistory) {
    return (
      <div className="card text-sm">
        <div className="font-semibold text-aistroyka-text-primary">Project intelligence</div>
        <p className="mt-2 text-aistroyka-warning">Insufficient history</p>
        <p className="mt-2 text-aistroyka-text-secondary">
          Current: {metrics.current?.stage ?? "—"} · {metrics.current?.completion_percent ?? 0}% · Risk: {metrics.current?.risk_level ?? "—"}
        </p>
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">Add at least one more completed analysis to see velocity and trends.</p>
      </div>
    );
  }

  const velocityStr =
    metrics.velocity != null
      ? `${metrics.velocity >= 0 ? "+" : ""}${metrics.velocity.toFixed(1)}%/day`
      : "—";
  const riskTrendSymbol =
    metrics.riskTrend === "up" ? "↑" : metrics.riskTrend === "down" ? "↓" : "→";

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">Project intelligence</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">Current stage:</span> {metrics.current?.stage ?? "—"}</div>
        <div><span className="text-aistroyka-text-tertiary">Completion:</span> {metrics.current?.completion_percent ?? 0}%</div>
        <div><span className="text-aistroyka-text-tertiary">Velocity:</span> {velocityStr}</div>
        <div><span className="text-aistroyka-text-tertiary">Risk trend:</span> {riskTrendSymbol} {metrics.riskTrend}</div>
      </div>
      {(metrics.regressionDetected || metrics.riskEscalationDetected) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {metrics.regressionDetected && <span className="rounded-card-sm bg-aistroyka-warning/20 px-2 py-0.5 text-aistroyka-warning">Regression detected</span>}
          {metrics.riskEscalationDetected && <span className="rounded-card-sm bg-aistroyka-error/20 px-2 py-0.5 text-aistroyka-error">Risk increasing</span>}
        </div>
      )}
    </div>
  );
}
