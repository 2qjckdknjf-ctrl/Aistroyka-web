import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkerDay } from "./worker-day.types";

export async function getOrCreateForDate(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayDate: string
): Promise<WorkerDay | null> {
  const { data: existing } = await supabase
    .from("worker_day")
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("day_date", dayDate)
    .maybeSingle();
  if (existing) return existing as WorkerDay;
  const { data: created, error } = await supabase
    .from("worker_day")
    .insert({ tenant_id: tenantId, user_id: userId, day_date: dayDate })
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at")
    .single();
  if (error || !created) return null;
  return created as WorkerDay;
}

export async function setStarted(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayDate: string
): Promise<WorkerDay | null> {
  const row = await getOrCreateForDate(supabase, tenantId, userId, dayDate);
  if (!row) return null;
  const { data, error } = await supabase
    .from("worker_day")
    .update({ started_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at")
    .single();
  if (error || !data) return null;
  return data as WorkerDay;
}

export async function setEnded(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayDate: string
): Promise<WorkerDay | null> {
  const row = await getOrCreateForDate(supabase, tenantId, userId, dayDate);
  if (!row) return null;
  const { data, error } = await supabase
    .from("worker_day")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at")
    .single();
  if (error || !data) return null;
  return data as WorkerDay;
}

export async function listDaysForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  filters: { from?: string; to?: string; limit: number }
): Promise<WorkerDay[]> {
  let query = supabase
    .from("worker_day")
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("day_date", { ascending: false })
    .limit(filters.limit);

  if (filters.from) query = query.gte("day_date", filters.from);
  if (filters.to) query = query.lte("day_date", filters.to);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as WorkerDay[];
}
