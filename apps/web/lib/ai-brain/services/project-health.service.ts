/**
 * Project health service: aggregates signals and computes health summary.
 * Uses snapshot and signal layers; no direct Supabase in this file beyond snapshot build.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectHealth, ProjectSnapshot } from "../domain";
import { buildProjectSnapshot } from "../mappers/snapshot.mapper";

function healthScoreFromSnapshot(s: ProjectSnapshot): number {
  let score = 100;
  if (s.overdueTaskCount > 0) score -= Math.min(25, s.overdueTaskCount * 5);
  if (s.workerCount > 0 && s.openReportCount === 0) score -= 15;
  if (s.taskCount > 0 && s.completedTaskCount === 0 && s.overdueTaskCount > 0) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function healthLabel(score: number): ProjectHealth["label"] {
  if (score >= 80) return "healthy";
  if (score >= 60) return "moderate";
  if (score >= 40) return "unstable";
  return "critical";
}

export async function getProjectHealth(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectHealth | null> {
  const snapshot = await buildProjectSnapshot(supabase, projectId, tenantId);
  if (!snapshot) return null;

  const score = healthScoreFromSnapshot(snapshot);
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

  return {
    projectId,
    tenantId,
    at: snapshot.at,
    score,
    label: healthLabel(score),
    blockers,
    missingData,
    delayIndicators,
  };
}
