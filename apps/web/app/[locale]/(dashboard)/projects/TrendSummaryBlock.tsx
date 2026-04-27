"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui-lite";
import type { VelocityTrend, RiskTrajectory } from "@/lib/intelligence/projection";

function formatVelocityTrend(t: VelocityTrend, tDetail: (key: string) => string): string {
  return t === "up" ? tDetail("up") : t === "down" ? tDetail("down") : tDetail("stable");
}

function formatRiskTrajectory(t: RiskTrajectory, tDetail: (key: string) => string): string {
  return t === "rising" ? tDetail("rising") : t === "falling" ? tDetail("falling") : tDetail("stable");
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
  const tDetail = useTranslations("dashboardDetail");
  if (!hasVelocity) {
    return (
      <Card>
        <p className="text-sm text-aistroyka-text-secondary">
          {tDetail("addAtLeastTwoAnalysesTrendSummary")}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("velocityTrend")}:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {formatVelocityTrend(velocityTrend, tDetail)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("riskTrajectory")}:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {formatRiskTrajectory(riskTrajectory, tDetail)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("delayProbability")}:</span>{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {delayProbability === "high" ? tDetail("high") : delayProbability === "medium" ? tDetail("medium") : tDetail("low")}
          </span>
        </div>
      </div>
      {lastDeltaSummary ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">{lastDeltaSummary}</p>
      ) : null}
    </Card>
  );
}
