/**
 * Risk intelligence: aggregates risk signals from tasks, reports, and AI analysis.
 * Prioritizes high/medium/low. Scaffold: combines overdue + blocked + missing evidence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "../domain";
import { getTaskSignals } from "../mappers/task-signals.mapper";
import { getExplicitProjectRisks } from "./project-risks.repository";
import { getReportSignals } from "./report-intelligence.service";
import { getEvidenceSignals } from "./evidence-intelligence.service";
import { getReportQualitySignals } from "./report-quality.service";
import { getSchedulePressureSignal } from "./schedule-pressure.service";
import { getMilestonePressureSignals, milestonePressureToRiskSignals } from "./milestone-pressure.service";
import { getCostRiskSignals } from "./cost-signals.service";

export async function getRiskSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<RiskSignal[]> {
  let explicitRisks: RiskSignal[] = [];
  try {
    explicitRisks = await getExplicitProjectRisks(supabase, projectId, tenantId);
  } catch {
    explicitRisks = [];
  }

  const taskSignals = await getTaskSignals(supabase, projectId, tenantId);
  const at = new Date().toISOString();

  const risks: RiskSignal[] = [...explicitRisks];

  const blockedSignals = taskSignals.filter((s) => s.type === "blocked");
  const overdueSignals = taskSignals.filter((s) => s.type === "overdue");

  for (const s of blockedSignals) {
    risks.push({
      projectId,
      source: "blocked",
      severity: s.severity,
      title: "Blocked task (inferred)",
      description: s.message,
      at,
      resourceType: "task",
      resourceId: s.taskId,
    });
  }

  for (const s of overdueSignals) {
    risks.push({
      projectId,
      source: "overdue",
      severity: s.severity,
      title: "Overdue task",
      description: s.message,
      at,
      resourceType: "task",
      resourceId: s.taskId,
    });
  }

  const reportSignals = await getReportSignals(supabase, projectId, tenantId, { sinceDays: 3 });
  const missingReports = reportSignals.filter((s) => s.type === "missing");
  if (missingReports.length >= 2) {
    risks.push({
      projectId,
      source: "delay",
      severity: "medium",
      title: "Missing recent reports",
      description: `${missingReports.length} days without report`,
      at,
    });
  }

  const evidenceSignals = await getEvidenceSignals(supabase, projectId, tenantId);
  const missingEvidence = evidenceSignals.filter((s) => s.severity === "high");
  if (missingEvidence.length > 0) {
    risks.push({
      projectId,
      source: "missing_evidence",
      severity: "medium",
      title: "Missing photo evidence",
      description: `${missingEvidence.length} task(s) with incomplete evidence`,
      at,
    });
  }

  const qualitySignals = await getReportQualitySignals(supabase, projectId, tenantId);
  const noMediaReports = qualitySignals.filter((q) => q.mediaCount === 0);
  if (noMediaReports.length > 0) {
    risks.push({
      projectId,
      source: "report_quality",
      severity: "low",
      title: "Reports without media",
      description: `${noMediaReports.length} report(s) linked to task but have no photos`,
      at,
    });
  }

  const schedulePressure = await getSchedulePressureSignal(supabase, projectId, tenantId);
  if (schedulePressure && schedulePressure.severity !== "low") {
    risks.push({
      projectId,
      source: "schedule_pressure",
      severity: schedulePressure.severity,
      title: "Schedule pressure (inferred)",
      description: schedulePressure.message,
      at,
    });
  }

  const milestoneSignals = await getMilestonePressureSignals(supabase, projectId, tenantId);
  const milestoneRisks = milestonePressureToRiskSignals(milestoneSignals);
  risks.push(...milestoneRisks);

  const costRisks = await getCostRiskSignals(supabase, projectId, tenantId);
  risks.push(...costRisks);

  return risks;
}

/** Count risk signals by severity. */
export function getRiskOverview(
  signals: RiskSignal[]
): { high: number; medium: number; low: number } {
  let high = 0,
    medium = 0,
    low = 0;
  for (const s of signals) {
    if (s.severity === "high") high++;
    else if (s.severity === "medium") medium++;
    else low++;
  }
  return { high, medium, low };
}
