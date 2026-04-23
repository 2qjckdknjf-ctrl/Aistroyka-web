/**
 * AI Brain Phase A — Read-only tool adapters.
 * Typed adapters over existing repo services.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getProjectHealth,
  getProjectHealthScore,
  getTopRiskInsights,
  getMissingEvidenceInsights,
  getReportSignals,
} from "@/lib/ai-brain/services";
import { getMilestonePressureSignals } from "@/lib/ai-brain/services/milestone-pressure.service";
import { getBudgetSummary } from "@/lib/domain/costs/cost.repository";
import type { ToolInput, ToolResult } from "./tool.types";

export async function getProjectHealthSummary(
  supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ label: string; score: number; blockers: string[] }>> {
  const [health, healthScore] = await Promise.all([
    getProjectHealth(supabase, input.projectId, input.tenantId),
    getProjectHealthScore(supabase, input.projectId, input.tenantId),
  ]);
  if (!health && !healthScore) {
    return { available: false, degradationReason: "health_unavailable" };
  }
  const h = healthScore ?? health!;
  return {
    available: true,
    data: {
      label: h.label,
      score: h.score,
      blockers: h.blockers ?? [],
    },
  };
}

export async function getTopRisksSummary(
  supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ count: number; highCount: number; items: unknown[] }>> {
  const items = await getTopRiskInsights(supabase, input.projectId, input.tenantId, 10);
  const highCount = items.filter((r) => r.severity === "high").length;
  return {
    available: true,
    data: { count: items.length, highCount, items },
  };
}

export async function getMissingEvidenceSummary(
  supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ count: number; items: unknown[] }>> {
  const items = await getMissingEvidenceInsights(supabase, input.projectId, input.tenantId);
  return {
    available: true,
    data: { count: items.length, items },
  };
}

export async function getRecentActivitySummary(
  supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ reportCount: number; completedTasks: number; submittedReports: number }>> {
  const reportSignals = await getReportSignals(supabase, input.projectId, input.tenantId, {
    sinceDays: 7,
  });
  const submitted = reportSignals.filter((r) => r.type === "submitted").length;
  return {
    available: true,
    data: {
      reportCount: input.snapshot.openTaskCounts.total,
      completedTasks: input.snapshot.openTaskCounts.completed,
      submittedReports: submitted,
    },
  };
}

export async function getScheduleSummaryIfAvailable(
  supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ milestoneCount: number; overdueCount: number; signals: unknown[] }>> {
  if (!input.snapshot.milestoneSummary.available) {
    return { available: false, degradationReason: "milestones_unavailable" };
  }
  const signals = await getMilestonePressureSignals(
    supabase,
    input.projectId,
    input.tenantId
  );
  const overdueCount = signals.filter((s) => s.overdue).length;
  return {
    available: true,
    data: {
      milestoneCount: input.snapshot.milestoneSummary.count,
      overdueCount,
      signals,
    },
  };
}

export async function getApprovalsSummaryIfAvailable(
  _supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ pendingCount: number }>> {
  return {
    available: true,
    data: { pendingCount: input.snapshot.approvalPressure.pendingCount },
  };
}

export async function getDocumentsSummaryIfAvailable(
  _supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ underReviewCount: number }>> {
  return {
    available: true,
    data: { underReviewCount: input.snapshot.documentPressure.underReviewCount },
  };
}

export async function getBudgetSummaryIfAvailable(
  supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<{ overBudget: boolean; summary?: string }>> {
  const summary = await getBudgetSummary(supabase, input.projectId, input.tenantId);
  if (!summary || summary.item_count === 0) {
    return { available: false, degradationReason: "budget_no_data" };
  }
  return {
    available: true,
    data: {
      overBudget: summary.over_budget ?? false,
      summary: `${summary.actual_total ?? 0} / ${summary.planned_total ?? 0} ${summary.currency ?? ""}`,
    },
  };
}

export async function getProjectTruthSnapshotAdapter(
  _supabase: SupabaseClient,
  input: ToolInput
): Promise<ToolResult<typeof input.snapshot>> {
  return { available: true, data: input.snapshot };
}
