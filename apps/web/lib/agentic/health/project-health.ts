/**
 * Deterministic project health v1.
 * Reuses AI Brain project-health-v2 formula; maps to GREEN / AMBER / RED.
 *
 * Formula (from project-health-v2.service.ts / PHASE7_PROJECT_HEALTH_MODEL.md):
 *   start at 100
 *   - overdue tasks: min(25, overdueCount * 5)
 *   - workers present and no reports: -15
 *   - tasks exist, none completed, some overdue: -20
 *   clamp 0–100
 *   GREEN >= 80, AMBER 60–79, RED < 60
 */

export type HealthBand = "GREEN" | "AMBER" | "RED";

export interface ProjectHealthV1 {
  score: number;
  band: HealthBand;
  reasons: string[];
  blockers: string[];
  confidence: string;
}

export function scoreToBand(score: number): HealthBand {
  if (score >= 80) return "GREEN";
  if (score >= 60) return "AMBER";
  return "RED";
}

export function computeHealthFromCounts(input: {
  overdueTaskCount: number;
  taskCount: number;
  completedTaskCount: number;
  workerCount: number;
  openReportCount: number;
}): ProjectHealthV1 {
  const OVERDUE_PER_TASK = 5;
  const OVERDUE_CAP = 25;
  const NO_REPORTS_PENALTY = 15;
  const COMBO_PENALTY = 20;

  let score = 100;
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (input.overdueTaskCount > 0) {
    const impact = Math.min(OVERDUE_CAP, input.overdueTaskCount * OVERDUE_PER_TASK);
    score -= impact;
    reasons.push(`${input.overdueTaskCount} overdue task(s) × ${OVERDUE_PER_TASK}, cap ${OVERDUE_CAP}`);
    blockers.push(`${input.overdueTaskCount} overdue task(s)`);
  }

  if (input.workerCount > 0 && input.openReportCount === 0) {
    score -= NO_REPORTS_PENALTY;
    reasons.push("Workers present but no recent reports");
  }

  if (input.taskCount > 0 && input.completedTaskCount === 0 && input.overdueTaskCount > 0) {
    score -= COMBO_PENALTY;
    reasons.push("Tasks exist, none completed, and some overdue");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    band: scoreToBand(score),
    reasons,
    blockers,
    confidence: input.workerCount === 0 && input.taskCount === 0 ? "medium" : "high",
  };
}
