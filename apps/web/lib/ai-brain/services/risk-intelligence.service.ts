/**
 * Risk intelligence: aggregates risk signals from tasks, reports, and AI analysis.
 * Prioritizes high/medium/low. Scaffold: combines overdue + missing evidence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "../domain";
import { getReportSignals } from "./report-intelligence.service";
import { getEvidenceSignals } from "./evidence-intelligence.service";

export async function getRiskSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<RiskSignal[]> {
  const at = new Date().toISOString();
  const risks: RiskSignal[] = [];

  const today = new Date().toISOString().slice(0, 10);
  const { data: overdueTasks } = await supabase
    .from("worker_tasks")
    .select("id, title, due_date")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"])
    .lt("due_date", today);

  for (const t of (overdueTasks ?? []) as { id: string; title: string; due_date: string }[]) {
    risks.push({
      projectId,
      source: "overdue",
      severity: "high",
      title: "Overdue task",
      description: t.title,
      at,
      resourceType: "task",
      resourceId: t.id,
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
