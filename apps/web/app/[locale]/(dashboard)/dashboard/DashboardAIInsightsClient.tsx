"use client";

import { useAIState, useProjectRisk } from "@/lib/features/ai/useAIState";
import { useTranslations } from "next-intl";
import { AISignalLine } from "@/components/ai/AISignalLine";
import { StructuralGridActivation } from "@/components/ai/StructuralGridActivation";
import { Card } from "@/components/ui";

/**
 * Dashboard AI Insights panel: global AI state from backend (ai_state_cache + ai_events).
 * AISignalLine + StructuralGridActivation driven by real data.
 * Portfolio AI Risk Score (v1) with trend.
 */
export function DashboardAIInsightsClient() {
  const tDetail = useTranslations("dashboardDetail");
  const { state, lastEvent, isLoading } = useAIState(null);
  const { risk, trend, isLoading: riskLoading } = useProjectRisk(null);

  const score = risk?.total_score ?? null;
  const trendArrow =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "—";

  return (
    <StructuralGridActivation state={state} highlight={state === "analyzing" || state === "risk_detected"}>
      <Card className="relative overflow-hidden border-l-4 border-l-transparent">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 items-center pt-0.5" title={tDetail("aiSignalHint")}>
            <AISignalLine state={state} totalScore={score ?? undefined} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
                {tDetail("aiInsights")}
              </h2>
              {!riskLoading && score !== null && (
                <span className="flex items-center gap-2 text-aistroyka-subheadline">
                  <span className="tabular-nums text-aistroyka-title3 font-bold text-aistroyka-text-primary" title={tDetail("portfolioAiRiskScoreHint")}>
                    {score}
                  </span>
                  <span className="text-aistroyka-text-tertiary" aria-label={`Trend: ${trend}`}>
                    {trendArrow}
                  </span>
                </span>
              )}
            </div>
            {isLoading ? (
              <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("loading")}</p>
            ) : (
              <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
                {state === "idle" && tDetail("noActiveInsights")}
                {state === "analyzing" && tDetail("aiIsAnalyzing")}
                {state === "risk_detected" && (lastEvent?.title ?? tDetail("riskDetected"))}
                {state === "optimization_found" && (lastEvent?.title ?? tDetail("optimizationAvailable"))}
                {state === "milestone_achieved" && (lastEvent?.title ?? tDetail("milestoneAchieved"))}
              </p>
            )}
          </div>
        </div>
      </Card>
    </StructuralGridActivation>
  );
}
