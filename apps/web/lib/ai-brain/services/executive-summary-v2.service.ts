/**
 * Executive summary v2: produces ExecutiveProjectSummary with explainable structure.
 * Grounded in real signals; includes dataSufficiency, recentProgress, atRisk, missingEvidence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExecutiveProjectSummary, DataSufficiency } from "../domain/intelligence-output.types";
import { getProjectHealth } from "./project-health.service";
import { getRiskSignals } from "./risk-intelligence.service";
import { getReportSignals } from "./report-intelligence.service";
import { getEvidenceSignals } from "./evidence-intelligence.service";
import { buildProjectSnapshot } from "../mappers/snapshot.mapper";
import { getMilestonePressureSignals } from "./milestone-pressure.service";

export async function getExecutiveProjectSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ExecutiveProjectSummary | null> {
  const [health, risks, snapshot, reportSignals, evidenceSignals, milestoneSignals] = await Promise.all([
    getProjectHealth(supabase, projectId, tenantId),
    getRiskSignals(supabase, projectId, tenantId),
    buildProjectSnapshot(supabase, projectId, tenantId),
    getReportSignals(supabase, projectId, tenantId, { sinceDays: 7 }),
    getEvidenceSignals(supabase, projectId, tenantId),
    getMilestonePressureSignals(supabase, projectId, tenantId),
  ]);

  if (!health || !snapshot) return null;

  const at = health.at;
  const submittedReports = reportSignals.filter((r) => r.type === "submitted");
  const missingReports = reportSignals.filter((r) => r.type === "missing");

  const recentProgress: string[] = [];
  if (submittedReports.length > 0) {
    recentProgress.push(`${submittedReports.length} report(s) submitted in last 7 days`);
  }
  if (snapshot.completedTaskCount > 0) {
    recentProgress.push(`${snapshot.completedTaskCount} task(s) completed`);
  }
  if (snapshot.analysisCount > 0) {
    recentProgress.push(`${snapshot.analysisCount} AI analysis(es) on media`);
  }
  if (recentProgress.length === 0) {
    recentProgress.push("No recent activity signals");
  }

  const atRisk: string[] = [];
  for (const r of risks.slice(0, 5)) {
    atRisk.push(r.title + (r.description ? `: ${r.description}` : ""));
  }
  if (atRisk.length === 0) atRisk.push("No risk signals in view");

  const missingEvidence: string[] = [];
  for (const es of evidenceSignals.filter((e) => e.severity === "high" || e.severity === "medium")) {
    missingEvidence.push(es.message);
  }
  if (missingReports.length >= 2) {
    missingEvidence.push(`${missingReports.length} day(s) without report`);
  }
  if (missingEvidence.length === 0) missingEvidence.push("No evidence gaps detected");

  const requiresAttention: string[] = [];
  if (health.blockers.length > 0) requiresAttention.push(...health.blockers);
  if (health.missingData.length > 0) requiresAttention.push(...health.missingData);
  const highRisks = risks.filter((r) => r.severity === "high");
  if (highRisks.length > 0) requiresAttention.push(`Review ${highRisks.length} high-priority risk(s)`);
  if (requiresAttention.length === 0) requiresAttention.push("No urgent items");

  const topRisks = risks.slice(0, 5).map((r) => r.title);
  const recommendedActions: string[] = [];
  if (health.blockers.length > 0) recommendedActions.push("Address blockers: " + health.blockers.join("; "));
  if (health.missingData.length > 0) recommendedActions.push("Improve data: " + health.missingData.join("; "));
  if (highRisks.length > 0) recommendedActions.push("Review high-priority risks");

  const overdueMilestones = milestoneSignals.filter((m) => m.overdue).length;
  const metrics = [
    { label: "Health", value: health.label },
    { label: "Score", value: String(health.score) },
    { label: "Active workers", value: String(snapshot.workerCount) },
    { label: "Overdue tasks", value: String(snapshot.overdueTaskCount) },
    { label: "Overdue milestones", value: String(overdueMilestones) },
    { label: "Reports (7d)", value: `${submittedReports.length} submitted` },
    { label: "Evidence gaps", value: String(evidenceSignals.length) },
  ];

  let dataSufficiency: DataSufficiency = "sufficient";
  if (snapshot.workerCount === 0 && snapshot.taskCount === 0) {
    dataSufficiency = "insufficient";
  } else if (reportSignals.length === 0 || snapshot.taskCount === 0) {
    dataSufficiency = "partial";
  }

  let missingDataDisclaimer: string | undefined;
  if (dataSufficiency === "insufficient") {
    missingDataDisclaimer = "No workers or tasks in project; summary is minimal.";
  } else if (dataSufficiency === "partial") {
    missingDataDisclaimer = "Limited report or task data; some insights may be incomplete.";
  }

  return {
    projectId,
    tenantId: health.tenantId,
    at,
    headline: `Project health: ${health.label}`,
    summary:
      health.blockers.length > 0
        ? `Blockers: ${health.blockers.join(". ")}. ${topRisks.length} risk(s) to review.`
        : `No critical blockers. ${topRisks.length} risk(s) in view.`,
    healthLabel: health.label,
    healthScore: health.score,
    recentProgress,
    atRisk,
    missingEvidence,
    requiresAttention,
    topRisks,
    recommendedActions,
    metrics,
    dataSufficiency,
    missingDataDisclaimer,
  };
}
