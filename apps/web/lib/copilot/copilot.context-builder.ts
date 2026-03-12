/**
 * Builds context for Copilot from AI brain outputs.
 * Aggregates snapshot, health, reports, risks, evidence, tasks, recommendations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProjectSnapshot, getTaskSignals } from "@/lib/ai-brain/mappers";
import {
  getProjectHealth,
  getReportSignals,
  getEvidenceSignals,
  getRiskSignals,
  getActionRecommendations,
  getExecutiveSummary,
} from "@/lib/ai-brain/services";
import type { CopilotRequest } from "./copilot.types";

export interface CopilotContextData {
  projectId: string;
  tenantId: string;
  snapshotSummary: string;
  healthSummary: string;
  reportSummary: string;
  riskSummary: string;
  evidenceSummary: string;
  taskSummary: string;
  recommendationsSummary: string;
  executiveHeadline: string;
}

export async function buildCopilotContext(
  supabase: SupabaseClient,
  request: CopilotRequest
): Promise<CopilotContextData | null> {
  const projectId = request.projectId;
  if (!projectId) return null;

  const [snapshot, health, reportSignals, evidenceSignals, taskSignals, riskSignals, recommendations, executive] =
    await Promise.all([
      buildProjectSnapshot(supabase, projectId, request.tenantId),
      getProjectHealth(supabase, projectId, request.tenantId),
      getReportSignals(supabase, projectId, request.tenantId),
      getEvidenceSignals(supabase, projectId, request.tenantId),
      getTaskSignals(supabase, projectId, request.tenantId),
      getRiskSignals(supabase, projectId, request.tenantId),
      getActionRecommendations(supabase, projectId, request.tenantId),
      getExecutiveSummary(supabase, projectId, request.tenantId),
    ]);

  if (!snapshot || !health) return null;

  const snapshotSummary = `Workers: ${snapshot.workerCount}, Reports: ${snapshot.reportCount}, Tasks: ${snapshot.taskCount} (${snapshot.overdueTaskCount} overdue), Media: ${snapshot.mediaCount}.`;
  const healthSummary = `Health: ${health.label} (score ${health.score}). Blockers: ${health.blockers.join(", ") || "none"}.`;
  const reportSummary =
    reportSignals.length === 0
      ? "No report issues."
      : reportSignals.filter((r) => r.type === "missing").length + " missing report(s).";
  const riskSummary =
    riskSignals.length === 0
      ? "No risk signals."
      : riskSignals.map((r) => `${r.severity}: ${r.title}`).join("; ");
  const evidenceSummary =
    evidenceSignals.length === 0
      ? "No evidence gaps."
      : evidenceSignals.map((e) => e.message).join("; ");
  const taskSummary =
    taskSignals.filter((t) => t.type === "overdue").length === 0
      ? "No overdue tasks."
      : taskSignals.filter((t) => t.type === "overdue").map((t) => t.message).join("; ");
  const recommendationsSummary =
    recommendations.length === 0 ? "No recommendations." : recommendations.map((r) => r.title).join("; ");

  return {
    projectId,
    tenantId: request.tenantId,
    snapshotSummary,
    healthSummary,
    reportSummary,
    riskSummary,
    evidenceSummary,
    taskSummary,
    recommendationsSummary,
    executiveHeadline: executive?.headline ?? health.label,
  };
}
