"use client";

import { Card } from "@/components/ui-lite";
import type { VelocityTrend, RiskTrajectory } from "@/lib/intelligence/projection";

function formatVelocityTrend(t: VelocityTrend): string {
  return t === "up" ? "Up" : t === "down" ? "Down" : "Stable";
}

function formatRiskTrajectory(t: RiskTrajectory): string {
  return t === "rising" ? "Rising" : t === "falling" ? "Falling" : "Stable";
}

export function TrendSummaryBlock({
  hasVelocity,
  velocityTrend,
  riskTrajectory,
  delayProbability,
  lastDeltaSummary,
}: {
  hasVelocity: boolean;
  velocityTrend: VelocityTrend;
  riskTrajectory: RiskTrajectory;
  delayProbability: "low" | "medium" | "high";
  lastDeltaSummary: string | null;
}) {
  if (!hasVelocity) {
    return (
      <Card>
        <p className="text-sm text-aistroyka-text-secondary">
          Add at least two analyses to see velocity and trend summary.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-aistroyka-text-tertiary">Velocity trend:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {formatVelocityTrend(velocityTrend)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Risk trajectory:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {formatRiskTrajectory(riskTrajectory)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Delay probability:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {delayProbability.charAt(0).toUpperCase() + delayProbability.slice(1)}
          </span>
        </div>
      </div>
      {lastDeltaSummary ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">{lastDeltaSummary}</p>
      ) : null}
    </Card>
  );
}
