"use client";

import { useTranslations } from "next-intl";
import {
  computeProjection,
  type DelayProbability,
  type RiskTrajectory,
  type VelocityTrend,
} from "@/lib/intelligence/projection";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";

function formatTrendVelocity(t: VelocityTrend, tDetail: (key: string) => string): string {
  return t === "up" ? tDetail("up") : t === "down" ? tDetail("down") : tDetail("stable");
}

function formatRiskTrajectory(t: RiskTrajectory, tDetail: (key: string) => string): string {
  return t === "rising" ? tDetail("rising") : t === "falling" ? tDetail("falling") : tDetail("stable");
}

function formatDelayProbability(p: DelayProbability, tDetail: (key: string) => string): string {
  if (p === "high") return tDetail("high");
  if (p === "medium") return tDetail("medium");
  return tDetail("low");
}

export function ConstructionForecast({
  history,
  referenceDate = new Date(),
}: {
  history: AnalysisSnapshot[];
  referenceDate?: Date;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const proj = computeProjection(history, referenceDate);

  if (history.length === 0) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        {tDetail("constructionForecastEmpty")}
      </div>
    );
  }

  if (!proj.hasVelocity) {
    return (
      <div className="card text-sm">
        <div className="font-semibold text-aistroyka-text-primary">{tDetail("constructionForecast")}</div>
        <p className="mt-2 text-aistroyka-warning">{tDetail("insufficientHistory")}</p>
        <p className="mt-2 text-aistroyka-text-secondary">
          {tDetail("currentCompletion")}: {proj.currentCompletion}%. {tDetail("addMoreAnalysisForForecast")}
        </p>
      </div>
    );
  }

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">{tDetail("constructionForecast")}</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">{tDetail("estimatedCompletionDate")}:</span> {proj.forecastDate ?? "—"}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("daysRemaining")}:</span> {proj.daysRemaining != null ? Math.round(proj.daysRemaining) : "—"}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("velocityTrend")}:</span> {formatTrendVelocity(proj.velocityTrend, tDetail)}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("riskTrajectory")}:</span> {formatRiskTrajectory(proj.riskTrajectory, tDetail)}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("delayProbability")}:</span> {formatDelayProbability(proj.delayProbability, tDetail)}</div>
      </div>
      {(proj.riskEscalating || proj.slowdownTrend) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {proj.riskEscalating && <span className="rounded-card-sm bg-aistroyka-warning/20 px-2 py-0.5 text-aistroyka-warning">{tDetail("riskEscalating")}</span>}
          {proj.slowdownTrend && <span className="rounded-card-sm bg-aistroyka-warning/20 px-2 py-0.5 text-aistroyka-warning">{tDetail("slowdownTrend")}</span>}
        </div>
      )}
    </div>
  );
}
