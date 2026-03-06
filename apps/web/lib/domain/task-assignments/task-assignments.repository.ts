import type { SupabaseClient } from "@supabase/supabase-js";

/** Task IDs assigned to user via task_assignments table. */
export async function getAssignedTaskIds(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("task_assignments")
    .select("task_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error || !data) return [];
  return (data as { task_id: string }[]).map((r) => r.task_id);
}

/** Check if task is assigned to user (via task_assignments or will fallback to worker_tasks.assigned_to in service). */
export async function isTaskAssignedTo(
  supabase: SupabaseClient,
  tenantId: string,
  taskId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("task_assignments")
    .select("task_id")
    .eq("tenant_id", tenantId)
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

/** Assign task to worker: replace assignments for task with single user, set worker_tasks.assigned_to. */
export async function assign(
  supabase: SupabaseClient,
  tenantId: string,
  taskId: string,
  userId: string,
  assignedBy: string
): Promise<boolean> {
  const { error: e0 } = await supabase
    .from("task_assignments")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("task_id", taskId);
  if (e0) return false;
  const { error: e1 } = await supabase.from("task_assignments").insert({
    tenant_id: tenantId,
    task_id: taskId,
    user_id: userId,
    assigned_by: assignedBy,
  });
  if (e1) return false;
  const { error: e2 } = await supabase
    .from("worker_tasks")
    .update({ assigned_to: userId, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("tenant_id", tenantId);
  return !e2;
}
