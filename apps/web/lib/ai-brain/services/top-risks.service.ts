/**
 * Top risk aggregation: produces ranked TopRiskInsight with explainable structure.
 * Uses RiskSignal, TaskSignal, EvidenceSignal; no invented data.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TopRiskInsight } from "../domain/intelligence-output.types";
import { getRiskSignals } from "./risk-intelligence.service";
import { getTaskSignals } from "../mappers/task-signals.mapper";
import { getEvidenceSignals } from "./evidence-intelligence.service";

function nextId(): string {
  return `risk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SEVERITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

export async function getTopRiskInsights(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  maxItems = 10
): Promise<TopRiskInsight[]> {
  const at = new Date().toISOString();

  const [riskSignals, taskSignals, evidenceSignals] = await Promise.all([
    getRiskSignals(supabase, projectId, tenantId),
    getTaskSignals(supabase, projectId, tenantId),
    getEvidenceSignals(supabase, projectId, tenantId),
  ]);

  const insights: TopRiskInsight[] = [];

  const sortedRisks = [...riskSignals].sort(
    (a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0)
  );

  let rank = 1;
  for (const r of sortedRisks.slice(0, maxItems)) {
    const severity = r.severity as TopRiskInsight["severity"];
    const source: TopRiskInsight["source"] =
      r.source === "manual" ? "explicit" : "inferred";
    const confidence: TopRiskInsight["confidence"] =
      r.resourceId && r.resourceType ? "high" : r.source === "overdue" ? "high" : "medium";

    let explanation = r.description ?? r.title;
    const factors: string[] = [];
    if (r.source === "overdue") factors.push("Task past due date");
    if (r.source === "blocked") factors.push("Overdue, in progress, no recent report (inferred)");
    if (r.source === "delay") factors.push("Multiple days without report");
    if (r.source === "missing_evidence") factors.push("Incomplete photo evidence");
    if (r.source === "report_quality") factors.push("Report linked to task but no media");
    if (r.source === "schedule_pressure") factors.push("Overdue concentration (inferred)");
    if (r.source === "milestone_overdue") factors.push("Milestone past target date or at risk");
    if (r.source === "budget_overrun") factors.push("Actual cost exceeds planned budget");
    if (r.source === "cost_pressure") factors.push("Budget pressure or cost item overrun");
    if (factors.length > 0) explanation = `${r.title}. ${factors.join(". ")}.`;

    insights.push({
      id: nextId(),
      projectId,
      rank: rank++,
      severity,
      title: r.title,
      description: r.description ?? "",
      source,
      explanation,
      evidenceReferences: r.resourceId && r.resourceType
        ? [{ resourceType: r.resourceType, resourceId: r.resourceId }]
        : [],
      confidence,
      contributingFactors: factors.length > 0 ? factors : [r.source],
      recommendedAction: getRecommendedAction(r),
      at,
    });
  }

  return insights;
}

function getRecommendedAction(r: { source: string; severity: string }): string {
  if (r.source === "overdue") return "Review and reschedule or complete overdue task.";
  if (r.source === "blocked") return "Unblock: request report or reassign task.";
  if (r.source === "delay") return "Request report submission for missing days.";
  if (r.source === "missing_evidence") return "Request additional photo evidence for affected tasks.";
  if (r.source === "report_quality") return "Request media for reports linked to tasks.";
  if (r.source === "schedule_pressure") return "Review overdue tasks and reschedule or complete.";
  if (r.source === "milestone_overdue") return "Review milestone and linked tasks; reschedule or complete.";
  if (r.source === "budget_overrun") return "Review budget and costs; adjust plan or scope.";
  if (r.source === "cost_pressure") return "Monitor spend and review cost items approaching or over plan.";
  if (r.severity === "high") return "Review and mitigate high-priority risk.";
  return "Monitor and address when feasible.";
}
