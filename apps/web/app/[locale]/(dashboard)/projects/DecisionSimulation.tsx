"use client";

import { useTranslations } from "next-intl";
import type { SimulationResult } from "@/lib/intelligence/simulation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

function formatDeltaDays(d: number | null, tDetail: (key: string, values?: Record<string, string | number | Date>) => string): string {
  if (d == null) return "—";
  const sign = d > 0 ? "+" : "";
  return tDetail("daysVsBaseline", { delta: `${sign}${Math.round(d)}` });
}

export function DecisionSimulation({ result }: { result: SimulationResult | null }) {
  const tDetail = useTranslations("dashboardDetail");
  if (result == null) {
    return (
      <DashboardGlassCard>
        <p className="text-sm text-aistroyka-text-secondary">{tDetail("decisionSimulationEmpty")}</p>
      </DashboardGlassCard>
    );
  }

  const { baseline, acceleration, degradation, deltaDaysAcceleration, deltaDaysDegradation, deltaHealthAcceleration, deltaHealthDegradation, deltaRiskAcceleration, deltaRiskDegradation } = result;

  return (
    <DashboardGlassCard>
      <div className="font-medium text-aistroyka-text-primary">{tDetail("decisionSimulation")}</div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-bg-primary/40 p-4">
          <div className="font-medium text-aistroyka-text-primary">{baseline.label}</div>
          <div className="mt-2 text-aistroyka-text-secondary">
            {tDetail("completion")}: {baseline.projectedCompletionDate ?? "—"}
          </div>
          <div className="text-aistroyka-text-secondary">
            {tDetail("risk")}: {baseline.projectedStrategicRiskIndex} · {tDetail("healthScore")}: {baseline.projectedHealthScore}
          </div>
          <div className="mt-1 text-xs text-aistroyka-text-tertiary">{tDetail("delay")}: {baseline.delayProbabilityLabel}</div>
        </div>
        <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-bg-primary/40 p-4">
          <div className="font-medium text-aistroyka-text-primary">{acceleration.label}</div>
          <div className="mt-2 text-aistroyka-text-secondary">
            {tDetail("completion")}: {acceleration.projectedCompletionDate ?? "—"}
          </div>
          <div className="text-aistroyka-text-secondary">
            {tDetail("risk")}: {acceleration.projectedStrategicRiskIndex} · {tDetail("healthScore")}: {acceleration.projectedHealthScore}
          </div>
          <div className="mt-1 text-xs text-aistroyka-text-tertiary">{tDetail("delay")}: {acceleration.delayProbabilityLabel}</div>
        </div>
        <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-bg-primary/40 p-4">
          <div className="font-medium text-aistroyka-text-primary">{degradation.label}</div>
          <div className="mt-2 text-aistroyka-text-secondary">
            {tDetail("completion")}: {degradation.projectedCompletionDate ?? "—"}
          </div>
          <div className="text-aistroyka-text-secondary">
            {tDetail("risk")}: {degradation.projectedStrategicRiskIndex} · {tDetail("healthScore")}: {degradation.projectedHealthScore}
          </div>
          <div className="mt-1 text-xs text-aistroyka-text-tertiary">{tDetail("delay")}: {degradation.delayProbabilityLabel}</div>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">{tDetail("impactSummaryVsBaseline")}:</span>
        <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
          <li>
            {tDetail("acceleration")}: {formatDeltaDays(deltaDaysAcceleration, tDetail)} · {tDetail("healthScore")} {deltaHealthAcceleration >= 0 ? "+" : ""}{deltaHealthAcceleration} · {tDetail("risk")} {deltaRiskAcceleration >= 0 ? "+" : ""}{deltaRiskAcceleration}
          </li>
          <li>
            {tDetail("degradation")}: {formatDeltaDays(deltaDaysDegradation, tDetail)} · {tDetail("healthScore")} {deltaHealthDegradation >= 0 ? "+" : ""}{deltaHealthDegradation} · {tDetail("risk")} +{deltaRiskDegradation}
          </li>
        </ul>
      </div>
    </DashboardGlassCard>
  );
}
