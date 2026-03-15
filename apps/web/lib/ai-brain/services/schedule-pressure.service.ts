/**
 * Schedule pressure signal: overdue concentration as substitute for critical path.
 * No CPM/dependencies; uses overdue task count and severity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface SchedulePressureSignal {
  projectId: string;
  overdueCount: number;
  overdueMoreThan7Days: number;
  severity: "low" | "medium" | "high";
  message: string;
  at: string;
}

export async function getSchedulePressureSignal(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<SchedulePressureSignal | null> {
  const at = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: tasks } = await supabase
    .from("worker_tasks")
    .select("id, due_date")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"])
    .lt("due_date", today);

  const overdue = (tasks ?? []) as { due_date: string }[];
  const overdueCount = overdue.length;
  const overdueMoreThan7Days = overdue.filter((t) => t.due_date < sevenDaysAgoStr).length;

  if (overdueCount === 0) return null;

  let severity: SchedulePressureSignal["severity"] = "low";
  if (overdueMoreThan7Days >= 2 || overdueCount >= 5) severity = "high";
  else if (overdueMoreThan7Days >= 1 || overdueCount >= 2) severity = "medium";

  return {
    projectId,
    overdueCount,
    overdueMoreThan7Days,
    severity,
    message: `${overdueCount} overdue task(s)${overdueMoreThan7Days > 0 ? `, ${overdueMoreThan7Days} more than 7 days` : ""} (inferred schedule pressure)`,
    at,
  };
}
