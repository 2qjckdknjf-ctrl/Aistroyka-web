/**
 * Executive summary: produces a structured brief for a project.
 * Uses project health, risk signals, and snapshot. No LLM required for scaffold.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExecutiveSummary } from "../domain";
import { getProjectHealth } from "./project-health.service";
import { getRiskSignals } from "./risk-intelligence.service";
import { buildProjectSnapshot } from "../mappers/snapshot.mapper";

export async function getExecutiveSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ExecutiveSummary | null> {
  const [health, risks, snapshot] = await Promise.all([
    getProjectHealth(supabase, projectId, tenantId),
    getRiskSignals(supabase, projectId, tenantId),
    buildProjectSnapshot(supabase, projectId, tenantId),
  ]);

  if (!health || !snapshot) return null;

  const topRisks = risks.slice(0, 5).map((r) => r.title);
  const recommendedActions: string[] = [];
  if (health.blockers.length > 0) recommendedActions.push("Address blockers: " + health.blockers.join("; "));
  if (health.missingData.length > 0) recommendedActions.push("Improve data: " + health.missingData.join("; "));
  if (risks.some((r) => r.severity === "high")) recommendedActions.push("Review high-priority risks");

  const metrics = [
    { label: "Health", value: health.label },
    { label: "Score", value: String(health.score) },
    { label: "Active workers", value: String(snapshot.workerCount) },
    { label: "Overdue tasks", value: String(snapshot.overdueTaskCount) },
    { label: "AI analyses", value: String(snapshot.analysisCount) },
  ];

  return {
    scope: "project",
    projectId,
    tenantId,
    at: health.at,
    headline: `Project health: ${health.label}`,
    summary: health.blockers.length > 0
      ? `Blockers: ${health.blockers.join(". ")}. ${topRisks.length} risk(s) to review.`
      : `No critical blockers. ${topRisks.length} risk(s) in view.`,
    healthLabel: health.label,
    topRisks,
    recommendedActions,
    metrics,
  };
}
