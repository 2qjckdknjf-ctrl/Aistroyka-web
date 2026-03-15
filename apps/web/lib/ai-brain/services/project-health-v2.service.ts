/**
 * Project health v2: produces ProjectHealthScore with factorContributions.
 * Formula is transparent and documented in PHASE7_PROJECT_HEALTH_MODEL.md.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectHealthScore } from "../domain/intelligence-output.types";
import { buildProjectSnapshot } from "../mappers/snapshot.mapper";

const OVERDUE_PER_TASK = 5;
const OVERDUE_CAP = 25;
const NO_REPORTS_PENALTY = 15;
const COMBO_PENALTY = 20;

export async function getProjectHealthScore(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectHealthScore | null> {
  const snapshot = await buildProjectSnapshot(supabase, projectId, tenantId);
  if (!snapshot) return null;

  const at = snapshot.at;
  const factorContributions: ProjectHealthScore["factorContributions"] = [];

  let score = 100;

  let overdueImpact = 0;
  if (snapshot.overdueTaskCount > 0) {
    overdueImpact = Math.min(OVERDUE_CAP, snapshot.overdueTaskCount * OVERDUE_PER_TASK);
    score -= overdueImpact;
    factorContributions.push({
      factor: "Overdue tasks",
      impact: -overdueImpact,
      explanation: `${snapshot.overdueTaskCount} overdue task(s) × ${OVERDUE_PER_TASK} each, cap ${OVERDUE_CAP}`,
    });
  }

  if (snapshot.workerCount > 0 && snapshot.openReportCount === 0) {
    score -= NO_REPORTS_PENALTY;
    factorContributions.push({
      factor: "No recent reports",
      impact: -NO_REPORTS_PENALTY,
      explanation: "Workers present but no reports in draft/submitted",
    });
  }

  if (
    snapshot.taskCount > 0 &&
    snapshot.completedTaskCount === 0 &&
    snapshot.overdueTaskCount > 0
  ) {
    score -= COMBO_PENALTY;
    factorContributions.push({
      factor: "No progress + overdue",
      impact: -COMBO_PENALTY,
      explanation: "Tasks exist, none completed, and some overdue",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label: ProjectHealthScore["label"] =
    score >= 80 ? "healthy" : score >= 60 ? "moderate" : score >= 40 ? "unstable" : "critical";

  const blockers: string[] = [];
  const missingData: string[] = [];
  const delayIndicators: string[] = [];

  if (snapshot.overdueTaskCount > 0) {
    blockers.push(`${snapshot.overdueTaskCount} overdue task(s)`);
    delayIndicators.push("Overdue tasks");
  }
  if (snapshot.workerCount > 0 && snapshot.openReportCount === 0) {
    missingData.push("No recent reports");
  }

  let confidence: ProjectHealthScore["confidence"] = "high";
  let missingDataDisclaimer: string | undefined;
  if (snapshot.workerCount === 0 && snapshot.taskCount === 0) {
    confidence = "medium";
    missingDataDisclaimer = "No workers or tasks; score is based on minimal data.";
  }

  return {
    projectId,
    tenantId: snapshot.tenantId,
    at,
    score,
    label,
    factorContributions,
    blockers,
    missingData,
    delayIndicators,
    confidence,
    missingDataDisclaimer,
  };
}
