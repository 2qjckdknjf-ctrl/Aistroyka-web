/**
 * Milestone pressure signals: overdue milestones, milestones with many incomplete tasks.
 * Fact-based; uses project_milestones and worker_tasks.milestone_id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "../domain";

const UPCOMING_DAYS = 7;
const INCOMPLETE_THRESHOLD = 0.5; // >50% incomplete = at risk

export interface MilestonePressureSignal {
  milestoneId: string;
  projectId: string;
  title: string;
  targetDate: string;
  status: string;
  linkedTaskCount: number;
  doneTaskCount: number;
  overdue: boolean;
  atRisk: boolean; // upcoming + many incomplete
  at: string;
}

/** Get milestone pressure signals for a project. */
export async function getMilestonePressureSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<MilestonePressureSignal[]> {
  const at = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const upcomingCutoff = new Date();
  upcomingCutoff.setDate(upcomingCutoff.getDate() + UPCOMING_DAYS);
  const upcomingCutoffStr = upcomingCutoff.toISOString().slice(0, 10);

  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("id, title, target_date, status")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"])
    .order("target_date", { ascending: true });

  if (!milestones?.length) return [];

  const signals: MilestonePressureSignal[] = [];

  for (const m of milestones as { id: string; title: string; target_date: string; status: string }[]) {
    const { data: tasks } = await supabase
      .from("worker_tasks")
      .select("id, status")
      .eq("milestone_id", m.id)
      .eq("tenant_id", tenantId);

    const taskList = (tasks ?? []) as { id: string; status: string }[];
    const linkedTaskCount = taskList.length;
    const doneTaskCount = taskList.filter((t) => t.status === "done").length;
    const overdue = m.target_date < today;
    const upcoming = m.target_date >= today && m.target_date <= upcomingCutoffStr;
    const incompleteRatio = linkedTaskCount > 0 ? (linkedTaskCount - doneTaskCount) / linkedTaskCount : 0;
    const atRisk = overdue || (upcoming && incompleteRatio > INCOMPLETE_THRESHOLD);

    signals.push({
      milestoneId: m.id,
      projectId,
      title: m.title,
      targetDate: m.target_date,
      status: m.status,
      linkedTaskCount,
      doneTaskCount,
      overdue,
      atRisk,
      at,
    });
  }

  return signals;
}

/** Convert milestone pressure to risk signals for integration. */
export function milestonePressureToRiskSignals(
  signals: MilestonePressureSignal[]
): RiskSignal[] {
  const at = new Date().toISOString();
  const risks: RiskSignal[] = [];

  for (const s of signals) {
    if (!s.atRisk) continue;

    const severity = s.overdue ? "high" : "medium";
    const message = s.overdue
      ? `Milestone "${s.title}" (${s.targetDate}) is overdue`
      : `Milestone "${s.title}" (${s.targetDate}) has ${s.linkedTaskCount - s.doneTaskCount}/${s.linkedTaskCount} incomplete task(s)`;

    risks.push({
      projectId: s.projectId,
      source: "milestone_overdue",
      severity,
      title: s.overdue ? "Overdue milestone" : "Milestone at risk",
      description: message,
      at,
      resourceType: "project_milestone",
      resourceId: s.milestoneId,
    });
  }

  return risks;
}
