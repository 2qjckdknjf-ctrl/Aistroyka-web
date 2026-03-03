"use client";

import {
  computeProjection,
  type DelayProbability,
  type RiskTrajectory,
  type VelocityTrend,
} from "@/lib/intelligence/projection";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";

function formatTrendVelocity(t: VelocityTrend): string {
  return t === "up" ? "up" : t === "down" ? "down" : "stable";
}

function formatRiskTrajectory(t: RiskTrajectory): string {
  return t === "rising" ? "rising" : t === "falling" ? "falling" : "stable";
}

function formatDelayProbability(p: DelayProbability): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function ConstructionForecast({
  history,
  referenceDate = new Date(),
}: {
  history: AnalysisSnapshot[];
  referenceDate?: Date;
}) {
  const proj = computeProjection(history, referenceDate);

  if (history.length === 0) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        Construction Forecast: No analyses yet. Run analyses to see projections.
      </div>
    );
  }

  if (!proj.hasVelocity) {
    return (
      <div className="card text-sm">
        <div className="font-semibold text-aistroyka-text-primary">Construction Forecast</div>
        <p className="mt-2 text-aistroyka-warning">Insufficient history</p>
        <p className="mt-2 text-aistroyka-text-secondary">
          Current completion: {proj.currentCompletion}%. Add at least one more analysis to see velocity and forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">Construction Forecast</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">Estimated completion date:</span> {proj.forecastDate ?? "—"}</div>
        <div><span className="text-aistroyka-text-tertiary">Days remaining:</span> {proj.daysRemaining != null ? Math.round(proj.daysRemaining) : "—"}</div>
        <div><span className="text-aistroyka-text-tertiary">Velocity trend:</span> {formatTrendVelocity(proj.velocityTrend)}</div>
        <div><span className="text-aistroyka-text-tertiary">Risk trajectory:</span> {formatRiskTrajectory(proj.riskTrajectory)}</div>
        <div><span className="text-aistroyka-text-tertiary">Delay probability:</span> {formatDelayProbability(proj.delayProbability)}</div>
      </div>
      {(proj.riskEscalating || proj.slowdownTrend) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {proj.riskEscalating && <span className="rounded-card-sm bg-aistroyka-warning/20 px-2 py-0.5 text-aistroyka-warning">Risk escalating</span>}
          {proj.slowdownTrend && <span className="rounded-card-sm bg-aistroyka-warning/20 px-2 py-0.5 text-aistroyka-warning">Slowdown trend</span>}
        </div>
      )}
    </div>
  );
}
