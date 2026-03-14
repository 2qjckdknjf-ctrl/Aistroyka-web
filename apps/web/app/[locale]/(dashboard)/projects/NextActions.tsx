"use client";

import { Link } from "@/i18n/navigation";
import { computeProjection } from "@/lib/intelligence/projection";
import { computeGovernance } from "@/lib/intelligence/governance";
import { computeStrategicRisk } from "@/lib/intelligence/strategicRisk";
import { computeHealthScore } from "@/lib/intelligence/healthScore";
import { computeCrossAnalysis } from "@/lib/intelligence/crossAnalysis";
import {
  computeActionItems,
  type ActionItem,
  type ActionableSignals,
} from "@/lib/intelligence/actionItems";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";
import type { AiAnalysis } from "@/lib/types";

interface PreviousSnapshot {
  completion_percent: number;
  created_at: string;
}

function priorityLabel(p: ActionItem["priority"]): string {
  return p;
}

export function NextActions({
  history,
  latestAnalysis,
  previousSnapshot,
  projectId,
}: {
  history: AnalysisSnapshot[];
  latestAnalysis: AiAnalysis | null;
  previousSnapshot: PreviousSnapshot | null;
  projectId?: string;
}) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-white p-4 sm:p-6">
        <div className="text-base font-semibold text-aistroyka-text-primary">Next Actions</div>
        <p className="mt-2 text-sm text-aistroyka-warning">
          Need more analyses to produce actions.
        </p>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          Upload more images and run AI analysis to get prioritized next steps.
        </p>
      </div>
    );
  }

  const proj = computeProjection(history);
  const cross = computeCrossAnalysis(history);
  let confidenceScore = 100;
  let regressionAnomaly = false;
  let jumpAnomaly = false;
  let logicalInconsistency = false;
  if (latestAnalysis) {
    const validation = validateAnalysisResult({
      stage: latestAnalysis.stage ?? "",
      completion_percent: latestAnalysis.completion_percent,
      risk_level: latestAnalysis.risk_level,
      detected_issues: latestAnalysis.detected_issues ?? [],
      recommendations: latestAnalysis.recommendations ?? [],
    });
    if (validation.success) {
      const gov = computeGovernance(
        { ...validation.data, created_at: latestAnalysis.created_at },
        previousSnapshot
      );
      confidenceScore = gov.confidenceScore;
      regressionAnomaly = gov.regressionAnomaly;
      jumpAnomaly = gov.jumpAnomaly;
      logicalInconsistency = gov.logicalInconsistency;
    }
  }

  const strategicResult = computeStrategicRisk({
    riskLevel: (latestAnalysis?.risk_level ?? "low") as "low" | "medium" | "high",
    slowdownTrend: proj.slowdownTrend,
    delayProbabilityHigh: proj.delayProbability === "high",
    confidenceBelow60: confidenceScore < 60,
    regressionAnomaly,
    logicalInconsistency,
  });

  const healthResult = computeHealthScore({
    strategicRiskIndex: strategicResult.strategicRiskIndex,
    confidenceScore,
    delayProbabilityHigh: proj.delayProbability === "high",
    slowdownTrend: proj.slowdownTrend,
    anomalyFlagCount: [regressionAnomaly, jumpAnomaly, logicalInconsistency].filter(Boolean).length,
  });

  const signals: ActionableSignals = {
    riskLevel: (latestAnalysis?.risk_level ?? "low") as "low" | "medium" | "high",
    strategicRiskIndex: strategicResult.strategicRiskIndex,
    healthScore: healthResult.healthScore,
    healthClassification: healthResult.classification,
    delayProbabilityHigh: proj.delayProbability === "high",
    slowdownTrend: proj.slowdownTrend,
    riskEscalating: proj.riskEscalating,
    regressionAnomaly,
    jumpAnomaly,
    logicalInconsistency,
    confidenceScore,
    stageInstability: cross.stageInstability,
    unstableProgress: cross.unstableProgress,
    structuralHighRisk: cross.structuralHighRisk,
    hasOutlier: cross.hasOutlier,
  };

  const actions = computeActionItems(signals);

  function priorityIndicator(p: ActionItem["priority"]): string {
    if (p === "P0") return "border-l-red-500 bg-aistroyka-error/10/30";
    if (p === "P1") return "border-l-amber-500 bg-aistroyka-warning/20/30";
    return "border-l-slate-300 bg-aistroyka-surface-raised/50";
  }

  function priorityBadgeClass(p: ActionItem["priority"]): string {
    if (p === "P0") return "bg-aistroyka-error/20 text-aistroyka-error border-aistroyka-error/50 font-semibold";
    if (p === "P1") return "bg-aistroyka-warning/20 text-aistroyka-warning border-aistroyka-warning/50 font-semibold";
    return "bg-slate-100 text-aistroyka-text-primary border-aistroyka-border-subtle";
  }

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-white p-4 sm:p-6">
      <div className="text-base font-semibold text-aistroyka-text-primary">Next Actions</div>
      <ul className="mt-4 space-y-0">
        {actions.map((action, idx) => (
          <li
            key={`${action.priority}-${idx}-${action.title}`}
            className={`border-l-4 pl-4 pr-2 py-3 ${priorityIndicator(action.priority)} ${idx > 0 ? "border-t border-aistroyka-border-subtle" : ""}`}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium text-aistroyka-text-primary">{action.title}</span>
              <span
                className={`rounded border px-2 py-0.5 text-xs ${priorityBadgeClass(action.priority)}`}
              >
                {priorityLabel(action.priority)}
              </span>
              <span className="text-xs text-aistroyka-text-tertiary">{action.owner}</span>
            </div>
            <p className="mt-1.5 text-sm text-aistroyka-text-secondary">{action.rationale}</p>
            <p className="mt-1 text-xs text-aistroyka-text-tertiary">
              Next: {action.next_step}
            </p>
          </li>
        ))}
      </ul>
      {projectId && (
        <Link
          href={`/dashboard/projects/${projectId}?tab=intelligence`}
          className="mt-4 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          Open project intelligence →
        </Link>
      )}
    </div>
  );
}
