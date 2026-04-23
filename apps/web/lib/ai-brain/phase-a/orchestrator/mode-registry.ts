/**
 * AI Brain Phase A — Mode registry.
 * Declares required context, allowed tools, and output contract per mode.
 */

import type { ModeDefinition, OrchestratorMode } from "./orchestrator.types";

export const MODE_REGISTRY: Record<OrchestratorMode, ModeDefinition> = {
  executive_summary: {
    mode: "executive_summary",
    requiredContext: ["snapshot", "health", "risks", "evidence", "executive_summary"],
    allowedTools: [
      "get_project_truth_snapshot",
      "get_project_health_summary",
      "get_top_risks_summary",
      "get_missing_evidence_summary",
      "get_recent_activity_summary",
      "get_schedule_summary_if_available",
      "get_approvals_summary_if_available",
      "get_documents_summary_if_available",
      "get_budget_summary_if_available",
    ],
    outputContract: "ExecutiveProjectBrief",
  },
  project_intelligence: {
    mode: "project_intelligence",
    requiredContext: ["snapshot", "health", "risks", "evidence"],
    allowedTools: [
      "get_project_truth_snapshot",
      "get_project_health_summary",
      "get_top_risks_summary",
      "get_missing_evidence_summary",
      "get_schedule_summary_if_available",
    ],
    outputContract: "ManagerProjectInsight",
  },
  manager_assist: {
    mode: "manager_assist",
    requiredContext: ["snapshot", "health", "risks", "evidence", "recommendations"],
    allowedTools: [
      "get_project_truth_snapshot",
      "get_project_health_summary",
      "get_top_risks_summary",
      "get_missing_evidence_summary",
      "get_recent_activity_summary",
      "get_schedule_summary_if_available",
      "get_approvals_summary_if_available",
      "get_documents_summary_if_available",
      "get_budget_summary_if_available",
    ],
    outputContract: "ManagerProjectInsight",
  },
  worker_assist: {
    mode: "worker_assist",
    requiredContext: ["snapshot", "tasks"],
    allowedTools: [
      "get_project_truth_snapshot",
      "get_recent_activity_summary",
      "get_schedule_summary_if_available",
    ],
    outputContract: "WorkerNextFocusSummary",
  },
  client_safe_summary: {
    mode: "client_safe_summary",
    requiredContext: ["snapshot", "health"],
    allowedTools: [
      "get_project_truth_snapshot",
      "get_project_health_summary",
    ],
    outputContract: "ClientSafeProjectSummary",
  },
};

export function getModeDefinition(mode: OrchestratorMode): ModeDefinition {
  return MODE_REGISTRY[mode];
}
