/**
 * AI Brain Phase A — Tool registry.
 * Dispatches tool invocations to adapters.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectTruthSnapshot } from "../truth-snapshot";
import type { ToolInput, ToolResult } from "./tool.types";
import {
  getProjectHealthSummary,
  getTopRisksSummary,
  getMissingEvidenceSummary,
  getRecentActivitySummary,
  getScheduleSummaryIfAvailable,
  getApprovalsSummaryIfAvailable,
  getDocumentsSummaryIfAvailable,
  getBudgetSummaryIfAvailable,
  getProjectTruthSnapshotAdapter,
} from "./tool-adapters";

const ADAPTERS: Record<
  string,
  (supabase: SupabaseClient, input: ToolInput) => Promise<ToolResult>
> = {
  get_project_truth_snapshot: getProjectTruthSnapshotAdapter,
  get_project_health_summary: getProjectHealthSummary,
  get_top_risks_summary: getTopRisksSummary,
  get_missing_evidence_summary: getMissingEvidenceSummary,
  get_recent_activity_summary: getRecentActivitySummary,
  get_schedule_summary_if_available: getScheduleSummaryIfAvailable,
  get_approvals_summary_if_available: getApprovalsSummaryIfAvailable,
  get_documents_summary_if_available: getDocumentsSummaryIfAvailable,
  get_budget_summary_if_available: getBudgetSummaryIfAvailable,
};

export async function executeTool(
  supabase: SupabaseClient,
  toolId: string,
  params: { projectId: string; tenantId: string; snapshot: ProjectTruthSnapshot }
): Promise<ToolResult> {
  const adapter = ADAPTERS[toolId];
  if (!adapter) {
    return { available: false, degradationReason: `unknown_tool:${toolId}` };
  }
  const input: ToolInput = {
    projectId: params.projectId,
    tenantId: params.tenantId,
    snapshot: params.snapshot,
  };
  return adapter(supabase, input);
}
