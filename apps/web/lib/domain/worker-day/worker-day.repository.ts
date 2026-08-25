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
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at, latitude, longitude, accuracy_m")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("day_date", dayDate)
    .maybeSingle();
  if (existing) return existing as WorkerDay;
  const { data: created, error } = await supabase
    .from("worker_day")
    .insert({ tenant_id: tenantId, user_id: userId, day_date: dayDate })
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at, latitude, longitude, accuracy_m")
    .single();
  if (error || !created) return null;
  return created as WorkerDay;
}

export async function setStarted(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayDate: string,
  evidence?: { latitude?: number; longitude?: number; accuracy_m?: number }
): Promise<WorkerDay | null> {
  const row = await getOrCreateForDate(supabase, tenantId, userId, dayDate);
  if (!row) return null;
  const patch: Record<string, unknown> = { started_at: new Date().toISOString() };
  if (typeof evidence?.latitude === "number") patch.latitude = evidence.latitude;
  if (typeof evidence?.longitude === "number") patch.longitude = evidence.longitude;
  if (typeof evidence?.accuracy_m === "number") patch.accuracy_m = evidence.accuracy_m;
  const { data, error } = await supabase
    .from("worker_day")
    .update(patch)
    .eq("id", row.id)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at, latitude, longitude, accuracy_m")
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
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at, latitude, longitude, accuracy_m")
    .single();
  if (error || !data) return null;
  return data as WorkerDay;
}
