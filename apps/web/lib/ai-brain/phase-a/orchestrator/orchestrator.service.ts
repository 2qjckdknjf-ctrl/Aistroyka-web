/**
 * AI Brain Phase A — Orchestrator service.
 * Composes truth snapshot and tools into AI-ready context. Read-only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { assembleProjectTruthSnapshot } from "../truth-snapshot";
import { executeTool } from "../tools/tool-registry";
import { getModeDefinition } from "./mode-registry";
import type {
  AiBrainRunContext,
  OrchestratorMode,
  OrchestratorResult,
} from "./orchestrator.types";

export async function runOrchestrator(
  supabase: SupabaseClient,
  ctx: AiBrainRunContext
): Promise<OrchestratorResult> {
  const snapshot = await assembleProjectTruthSnapshot(
    supabase,
    ctx.projectId,
    ctx.tenantId
  );

  if (!snapshot) {
    return {
      success: false,
      mode: ctx.mode,
      snapshot: null,
      context: {},
      output: null,
      degradationFlags: ["snapshot_missing"],
      error: "Project truth snapshot unavailable",
    };
  }

  const def = getModeDefinition(ctx.mode);
  const degradationFlags: string[] = [];

  const context: Record<string, unknown> = {
    snapshot,
    mode: ctx.mode,
  };

  for (const toolId of def.allowedTools) {
    const result = await executeTool(supabase, toolId, {
      projectId: ctx.projectId,
      tenantId: ctx.tenantId,
      snapshot,
    });
    if (result.available) {
      context[toolId] = result.data;
    } else {
      degradationFlags.push(`${toolId}_unavailable`);
    }
  }

  const output = buildOutputFromContext(ctx.mode, context, snapshot);

  return {
    success: true,
    mode: ctx.mode,
    snapshot,
    context,
    output,
    degradationFlags,
  };
}

function buildOutputFromContext(
  mode: OrchestratorMode,
  context: Record<string, unknown>,
  snapshot: NonNullable<Awaited<ReturnType<typeof assembleProjectTruthSnapshot>>>
): Record<string, unknown> | null {
  const base = {
    projectId: snapshot.projectId,
    tenantId: snapshot.tenantId,
    at: snapshot.at,
    projectStatus: snapshot.projectStatus,
    dataSufficiency: snapshot.dataSufficiencyFlags,
  };

  const unavailableData: string[] = [];
  if (snapshot.dataSufficiencyFlags.budget === "unavailable") {
    unavailableData.push("budget");
  }
  if (snapshot.dataSufficiencyFlags.schedule === "unavailable") {
    unavailableData.push("schedule");
  }
  if (snapshot.snapshotWarnings.length > 0) {
    unavailableData.push(...snapshot.snapshotWarnings);
  }

  switch (mode) {
    case "executive_summary":
      return {
        ...base,
        type: "ExecutiveProjectBrief",
        headline:
          context.get_project_health_summary
            ? (context.get_project_health_summary as { label?: string }).label
            : snapshot.projectStatus,
        facts: context,
        inferredStatements: [],
        unavailableData,
        confidenceNote: snapshot.intelligenceSummaryAvailability
          ? null
          : "Limited data availability",
        recommendedNextAttention:
          snapshot.snapshotWarnings.length > 0
            ? snapshot.snapshotWarnings[0]
            : snapshot.topRisksSummary.highCount > 0
              ? "Review high-priority risks"
              : null,
      };
    case "project_intelligence":
    case "manager_assist":
      return {
        ...base,
        type: "ManagerProjectInsight",
        facts: context,
        inferredStatements: [],
        unavailableData,
        confidenceNote: snapshot.intelligenceSummaryAvailability ? null : "Limited data availability",
        recommendedNextAttention:
          snapshot.topRisksSummary.highCount > 0
            ? "Review high-priority risks"
            : snapshot.missingEvidenceSummary.count > 0
              ? "Address evidence gaps"
              : null,
      };
    case "worker_assist":
      return {
        ...base,
        type: "WorkerNextFocusSummary",
        facts: context,
        inferredStatements: [],
        unavailableData,
        recommendedNextAttention:
          snapshot.openTaskCounts.overdue > 0 ? "Complete overdue tasks" : null,
      };
    case "client_safe_summary":
      return {
        ...base,
        type: "ClientSafeProjectSummary",
        headline: snapshot.projectStatus,
        facts: {
          snapshot: {
            projectStatus: snapshot.projectStatus,
            health: context.get_project_health_summary,
          },
        },
        inferredStatements: [],
        unavailableData,
        confidenceNote: null,
        recommendedNextAttention: null,
      };
    default: {
      const _: never = mode;
      return { ...base, type: "unknown" };
    }
  }
}
