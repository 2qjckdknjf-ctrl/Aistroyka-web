/**
 * Maps worker_tasks to TaskSignal[] for the AI brain.
 * Includes heuristic blocked detection: overdue + in_progress + no report for task in last 14 days.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskSignal } from "../domain";

const BLOCKED_NO_REPORT_DAYS = 14;

export async function getTaskSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<TaskSignal[]> {
  const at = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const blockedSince = new Date();
  blockedSince.setDate(blockedSince.getDate() - BLOCKED_NO_REPORT_DAYS);
  const blockedSinceIso = blockedSince.toISOString().slice(0, 10);

  const { data: tasks } = await supabase
    .from("worker_tasks")
    .select("id, status, due_date, assigned_to, title")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"]);

  const signals: TaskSignal[] = [];
  const taskIds = (tasks ?? []).map((t) => (t as { id: string }).id);

  let tasksWithRecentReport = new Set<string>();
  if (taskIds.length > 0) {
    const { data: reports } = await supabase
      .from("worker_reports")
      .select("task_id, submitted_at")
      .eq("tenant_id", tenantId)
      .in("task_id", taskIds)
      .not("submitted_at", "is", null)
      .gte("submitted_at", blockedSinceIso);
    for (const r of (reports ?? []) as { task_id: string }[]) {
      if (r.task_id) tasksWithRecentReport.add(r.task_id);
    }
  }

  for (const t of (tasks ?? []) as {
    id: string;
    status: string;
    due_date: string | null;
    assigned_to: string | null;
    title: string;
  }[]) {
    const dueDate = t.due_date;
    const overdue = dueDate && dueDate < today;
    const hasRecentReport = tasksWithRecentReport.has(t.id);
    const appearsBlocked = overdue && t.status === "in_progress" && !hasRecentReport;

    if (appearsBlocked && dueDate) {
      const daysOverdue = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
      signals.push({
        taskId: t.id,
        projectId,
        type: "blocked",
        severity: daysOverdue > 7 ? "high" : "medium",
        dueDate,
        assignedTo: t.assigned_to ?? undefined,
        message: `Task "${t.title}" appears blocked: overdue ${daysOverdue} day(s), in progress, no report in ${BLOCKED_NO_REPORT_DAYS} days (inferred)`,
        at,
      });
    } else if (overdue && dueDate) {
      const daysOverdue = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
      signals.push({
        taskId: t.id,
        projectId,
        type: "overdue",
        severity: daysOverdue > 7 ? "high" : daysOverdue > 2 ? "medium" : "low",
        dueDate,
        assignedTo: t.assigned_to ?? undefined,
        message: `Task "${t.title}" is ${daysOverdue} day(s) overdue`,
        at,
      });
    } else {
      signals.push({
        taskId: t.id,
        projectId,
        type: "on_track",
        severity: "low",
        dueDate: t.due_date ?? undefined,
        assignedTo: t.assigned_to ?? undefined,
        message: `Task "${t.title}" on track`,
        at,
      });
    }
  }
  return signals;
}
