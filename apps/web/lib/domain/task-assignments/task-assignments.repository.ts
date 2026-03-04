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
