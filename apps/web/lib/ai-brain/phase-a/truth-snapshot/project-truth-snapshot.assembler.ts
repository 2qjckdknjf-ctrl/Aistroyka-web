/**
 * AI Brain Phase A — Project Truth Snapshot assembler.
 * Builds ProjectTruthSnapshot from existing services only. No direct DB.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProjectSnapshot } from "@/lib/ai-brain/mappers";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import { deriveProjectStatus } from "@/lib/domain/projects/project-status.service";
import {
  getProjectHealth,
  getReportSignals,
  getEvidenceSignals,
  getRiskSignals,
  getTopRiskInsights,
  getMissingEvidenceInsights,
} from "@/lib/ai-brain/services";
import type {
  ProjectTruthSnapshot,
  DataSufficiencyFlags,
  ReportFreshness,
  EvidenceQualitySummary,
} from "./project-truth-snapshot.types";

function defaultSufficiencyFlags(): DataSufficiencyFlags {
  return {
    snapshot: "missing",
    health: "missing",
    risks: "missing",
    evidence: "missing",
    schedule: "unavailable",
    approvals: "unavailable",
    budget: "unavailable",
  };
}

export async function assembleProjectTruthSnapshot(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectTruthSnapshot | null> {
  const snapshot = await buildProjectSnapshot(supabase, projectId, tenantId);
  if (!snapshot) return null;

  const at = snapshot.at;
  const warnings: string[] = [];
  const flags = defaultSufficiencyFlags();

  const [summary, health, reportSignals, evidenceSignals, riskSignals, topRisks, missingEvidence] =
    await Promise.all([
      getProjectSummary(supabase, projectId, tenantId),
      getProjectHealth(supabase, projectId, tenantId),
      getReportSignals(supabase, projectId, tenantId, { sinceDays: 7 }),
      getEvidenceSignals(supabase, projectId, tenantId),
      getRiskSignals(supabase, projectId, tenantId),
      getTopRiskInsights(supabase, projectId, tenantId, 10),
      getMissingEvidenceInsights(supabase, projectId, tenantId),
    ]);

  flags.snapshot = "full";

  const derived = deriveProjectStatus({
    tasksTotal: summary.tasksTotal,
    tasksInProgress: summary.tasksInProgress,
    tasksDone: summary.tasksDone,
    milestonesCount: summary.milestonesCount,
    overdueMilestonesCount: summary.overdueMilestonesCount,
    pendingReportApprovalsCount: summary.pendingReportApprovalsCount,
    openIssuesCount: summary.openIssuesCount,
    pendingDecisionsCount: summary.pendingDecisionsCount,
    budgetOverBudget: summary.budgetOverBudget,
    budgetNearingLimit: summary.budgetNearingLimit,
    costLineOverrunCount: summary.costLineOverrunCount,
    budgetItemCount: summary.budgetItemCount,
  });

  let lastActivityAt: string | null = at;
  if (snapshot.reportCount > 0 || snapshot.completedTaskCount > 0) {
    lastActivityAt = at;
  }

  let reportFreshness: ReportFreshness = "unknown";
  if (reportSignals.length === 0 && snapshot.workerCount > 0) {
    reportFreshness = "none";
  } else if (reportSignals.some((r) => r.type === "submitted")) {
    reportFreshness = "fresh";
  } else if (reportSignals.some((r) => r.type === "missing" || r.type === "late")) {
    reportFreshness = "stale";
  } else if (reportSignals.length > 0) {
    reportFreshness = "fresh";
  }

  let evidenceQualitySummary: EvidenceQualitySummary = "unknown";
  const highEvidence = evidenceSignals.filter((e) => e.severity === "high" || e.severity === "medium");
  if (highEvidence.length > 0 || missingEvidence.length > 0) {
    evidenceQualitySummary = "gaps";
  } else if (evidenceSignals.length === 0 && snapshot.mediaCount > 0) {
    evidenceQualitySummary = "sufficient";
  } else if (snapshot.mediaCount === 0) {
    evidenceQualitySummary = "unknown";
  } else {
    evidenceQualitySummary = "sufficient";
  }

  const highRiskCount = topRisks.filter((r) => r.severity === "high").length;

  flags.health = health ? "full" : "missing";
  flags.risks = riskSignals.length > 0 || topRisks.length > 0 ? "full" : "partial";
  flags.evidence = evidenceSignals.length > 0 || missingEvidence.length > 0 ? "full" : "partial";
  flags.schedule = summary.milestonesCount > 0 ? "full" : "unavailable";
  flags.approvals = "full";
  flags.budget =
    summary.budgetItemCount > 0
      ? summary.budgetOverBudget || summary.costLineOverrunCount > 0
        ? "partial"
        : "full"
      : "unavailable";

  const intelligenceSummaryAvailability = !!(health && (topRisks.length > 0 || missingEvidence.length > 0 || health.blockers.length > 0));

  return {
    tenantId,
    projectId,
    at,
    projectStatus: derived.projectStatus,
    lastActivityAt,
    openTaskCounts: {
      total: snapshot.taskCount,
      overdue: snapshot.overdueTaskCount,
      completed: snapshot.completedTaskCount,
      inProgress: summary.tasksInProgress,
    },
    reportFreshness,
    evidenceQualitySummary,
    topRisksSummary: { count: topRisks.length, highCount: highRiskCount },
    missingEvidenceSummary: { count: missingEvidence.length },
    intelligenceSummaryAvailability,
    milestoneSummary: { count: summary.milestonesCount, available: summary.milestonesCount > 0 },
    approvalPressure: { pendingCount: summary.pendingDecisionsCount, available: true },
    documentPressure: { underReviewCount: summary.pendingDecisionsCount, available: true },
    budgetPressure: {
      available: summary.budgetItemCount > 0,
      overBudget: summary.budgetOverBudget,
      nearingLimit: summary.budgetNearingLimit,
      lineOverruns: summary.costLineOverrunCount,
    },
    dataSufficiencyFlags: flags,
    snapshotWarnings: warnings,
  };
}
