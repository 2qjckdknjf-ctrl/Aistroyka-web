import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "./task.types";

export async function listTasksForUser(
  _supabase: SupabaseClient,
  _tenantId: string,
  _userId: string
): Promise<Task[]> {
  return [];
}
