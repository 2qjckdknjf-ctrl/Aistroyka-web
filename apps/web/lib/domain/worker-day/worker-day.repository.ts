import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkerDay } from "./worker-day.types";

const WORKER_DAY_SELECT =
  "id, tenant_id, user_id, day_date, project_id, started_at, ended_at, created_at, latitude, longitude, accuracy_m";

export async function getOrCreateForDate(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayDate: string,
  projectId?: string | null
): Promise<WorkerDay | null> {
  const { data: existing } = await supabase
    .from("worker_day")
    .select(WORKER_DAY_SELECT)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("day_date", dayDate)
    .maybeSingle();
  if (existing) {
    const row = existing as WorkerDay;
    if (projectId && row.project_id && row.project_id !== projectId) return null;
    return row;
  }
  const { data: created, error } = await supabase
    .from("worker_day")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      day_date: dayDate,
      ...(projectId ? { project_id: projectId } : {}),
    })
    .select(WORKER_DAY_SELECT)
    .single();
  if (error || !created) return null;
  return created as WorkerDay;
}

export async function setStarted(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayDate: string,
  evidence?: { project_id?: string; latitude?: number; longitude?: number; accuracy_m?: number }
): Promise<WorkerDay | null> {
  const projectId = evidence?.project_id?.trim() || null;
  const row = await getOrCreateForDate(supabase, tenantId, userId, dayDate, projectId);
  if (!row) return null;
  const patch: Record<string, unknown> = { started_at: new Date().toISOString() };
  if (!row.project_id && projectId) patch.project_id = projectId;
  if (typeof evidence?.latitude === "number") patch.latitude = evidence.latitude;
  if (typeof evidence?.longitude === "number") patch.longitude = evidence.longitude;
  if (typeof evidence?.accuracy_m === "number") patch.accuracy_m = evidence.accuracy_m;
  const { data, error } = await supabase
    .from("worker_day")
    .update(patch)
    .eq("id", row.id)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .select(WORKER_DAY_SELECT)
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
    .select(WORKER_DAY_SELECT)
    .single();
  if (error || !data) return null;
  return data as WorkerDay;
}
