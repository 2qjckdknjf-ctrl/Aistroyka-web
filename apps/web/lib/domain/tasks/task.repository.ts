import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "./task.types";

/** List tasks assigned to user with due_date = today (or overdue). */
export async function listTasksForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("worker_tasks")
    .select("id, project_id, title, status, assigned_to, due_date, created_at")
    .eq("tenant_id", tenantId)
    .eq("assigned_to", userId)
    .lte("due_date", today)
    .in("status", ["pending", "in_progress"])
    .order("due_date", { ascending: true });
  if (error) return [];
  return (data ?? []) as Task[];
}
