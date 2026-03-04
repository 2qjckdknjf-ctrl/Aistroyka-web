import type { SupabaseClient } from "@supabase/supabase-js";
import { getAssignedTaskIds } from "@/lib/domain/task-assignments";
import type { Task } from "./task.types";

/**
 * List tasks assigned to user: worker_tasks.assigned_to = user OR task in task_assignments.
 * Due date <= today (or overdue), status pending/in_progress.
 */
export async function listTasksForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10);
  const assignedIds = await getAssignedTaskIds(supabase, tenantId, userId);
  const base = supabase
    .from("worker_tasks")
    .select("id, project_id, title, status, assigned_to, due_date, created_at")
    .eq("tenant_id", tenantId)
    .lte("due_date", today)
    .in("status", ["pending", "in_progress"]);
  const { data: byAssignedTo, error: e1 } = await base.eq("assigned_to", userId);
  if (e1) return [];
  const fromLegacy = (byAssignedTo ?? []) as Task[];
  if (assignedIds.length === 0) return fromLegacy;
  const legacyIds = new Set(fromLegacy.map((t) => t.id));
  const extraIds = assignedIds.filter((id) => !legacyIds.has(id));
  if (extraIds.length === 0) return fromLegacy;
  const { data: byTable, error: e2 } = await supabase
    .from("worker_tasks")
    .select("id, project_id, title, status, assigned_to, due_date, created_at")
    .eq("tenant_id", tenantId)
    .in("id", extraIds)
    .lte("due_date", today)
    .in("status", ["pending", "in_progress"])
    .order("due_date", { ascending: true });
  if (e2 || !byTable?.length) return fromLegacy;
  const combined = [...fromLegacy, ...(byTable as Task[])];
  combined.sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  return combined;
}
