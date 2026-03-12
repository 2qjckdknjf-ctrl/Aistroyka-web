/**
 * Maps worker_tasks to TaskSignal[] for the AI brain.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskSignal } from "../domain";

export async function getTaskSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<TaskSignal[]> {
  const at = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const { data: tasks } = await supabase
    .from("worker_tasks")
    .select("id, status, due_date, assigned_to, title")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"]);

  const signals: TaskSignal[] = [];
  for (const t of (tasks ?? []) as { id: string; status: string; due_date: string | null; assigned_to: string | null; title: string }[]) {
    const dueDate = t.due_date;
    const overdue = dueDate && dueDate < today;
    if (overdue && dueDate) {
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
