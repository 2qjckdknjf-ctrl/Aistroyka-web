"use client";

import type { SimulationResult } from "@/lib/intelligence/simulation";

function formatDeltaDays(d: number | null): string {
  if (d == null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${Math.round(d)} days vs baseline`;
}

export function DecisionSimulation({ result }: { result: SimulationResult | null }) {
  if (result == null) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        Decision Simulation: Need velocity and current metrics. Run analyses to enable.
      </div>
    );
  }

  const { baseline, acceleration, degradation, deltaDaysAcceleration, deltaDaysDegradation, deltaHealthAcceleration, deltaHealthDegradation, deltaRiskAcceleration, deltaRiskDegradation } = result;

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm sm:p-6">
      <div className="font-medium text-aistroyka-text-primary">Decision Simulation</div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-aistroyka-border-subtle bg-white p-4">
          <div className="font-medium text-aistroyka-text-primary">{baseline.label}</div>
          <div className="mt-2 text-aistroyka-text-secondary">
            Completion: {baseline.projectedCompletionDate ?? "—"}
          </div>
          <div className="text-aistroyka-text-secondary">
            Risk: {baseline.projectedStrategicRiskIndex} · Health: {baseline.projectedHealthScore}
          </div>
          <div className="mt-1 text-xs text-aistroyka-text-tertiary">Delay: {baseline.delayProbabilityLabel}</div>
        </div>
        <div className="rounded-lg border border-aistroyka-border-subtle bg-white p-4">
          <div className="font-medium text-aistroyka-text-primary">{acceleration.label}</div>
          <div className="mt-2 text-aistroyka-text-secondary">
            Completion: {acceleration.projectedCompletionDate ?? "—"}
          </div>
          <div className="text-aistroyka-text-secondary">
            Risk: {acceleration.projectedStrategicRiskIndex} · Health: {acceleration.projectedHealthScore}
          </div>
          <div className="mt-1 text-xs text-aistroyka-text-tertiary">Delay: {acceleration.delayProbabilityLabel}</div>
        </div>
        <div className="rounded-lg border border-aistroyka-border-subtle bg-white p-4">
          <div className="font-medium text-aistroyka-text-primary">{degradation.label}</div>
          <div className="mt-2 text-aistroyka-text-secondary">
            Completion: {degradation.projectedCompletionDate ?? "—"}
          </div>
          <div className="text-aistroyka-text-secondary">
            Risk: {degradation.projectedStrategicRiskIndex} · Health: {degradation.projectedHealthScore}
          </div>
          <div className="mt-1 text-xs text-aistroyka-text-tertiary">Delay: {degradation.delayProbabilityLabel}</div>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-aistroyka-text-tertiary">Impact summary (vs baseline):</span>
        <ul className="mt-2 list-inside list-disc text-aistroyka-text-primary">
          <li>
            Acceleration: {formatDeltaDays(deltaDaysAcceleration)} · Health {deltaHealthAcceleration >= 0 ? "+" : ""}{deltaHealthAcceleration} · Risk {deltaRiskAcceleration >= 0 ? "+" : ""}{deltaRiskAcceleration}
          </li>
          <li>
            Degradation: {formatDeltaDays(deltaDaysDegradation)} · Health {deltaHealthDegradation >= 0 ? "+" : ""}{deltaHealthDegradation} · Risk +{deltaRiskDegradation}
          </li>
        </ul>
      </div>
    </div>
  );
}
