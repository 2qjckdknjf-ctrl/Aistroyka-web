import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadTasks } from "./task.policy";
import * as repo from "./task.repository";
import type { Task } from "./task.types";

export async function listTasksForToday(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: Task[]; error: string | null }> {
  if (!canReadTasks(ctx)) return { data: [], error: "Insufficient rights" };
  try {
    const data = await repo.listTasksForUser(supabase, ctx.tenantId, ctx.userId);
    return { data, error: null };
  } catch {
    return { data: [], error: null };
  }
}
