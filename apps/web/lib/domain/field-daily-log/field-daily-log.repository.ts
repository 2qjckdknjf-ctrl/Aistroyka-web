import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateFieldDailyLogInput,
  FieldDailyLog,
  UpdateFieldDailyLogDraftInput,
} from "./field-daily-log.types";

const LOG_SELECT =
  "id, project_id, tenant_id, work_date, status, note, summary, work_done, blockers, weather, media_refs, created_by, confirmed_at, confirmed_by, created_at, updated_at";

function normalizeRow(row: Record<string, unknown>): FieldDailyLog {
  const refs = row.media_refs;
  return {
    ...(row as unknown as FieldDailyLog),
    media_refs: Array.isArray(refs) ? (refs as string[]) : [],
  };
}

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { work_date?: string; status?: string; limit?: number }
): Promise<FieldDailyLog[]> {
  let query = supabase
    .from("field_daily_logs")
    .select(LOG_SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts?.work_date) query = query.eq("work_date", opts.work_date);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => normalizeRow(row as Record<string, unknown>));
}

export async function getById(
  supabase: SupabaseClient,
  logId: string,
  tenantId: string
): Promise<FieldDailyLog | null> {
  const { data, error } = await supabase
    .from("field_daily_logs")
    .select(LOG_SELECT)
    .eq("id", logId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeRow(data as Record<string, unknown>);
}

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  input: CreateFieldDailyLogInput
): Promise<FieldDailyLog | null> {
  const { data, error } = await supabase
    .from("field_daily_logs")
    .insert({
      project_id: input.project_id,
      tenant_id: tenantId,
      work_date: input.work_date,
      status: "draft",
      note: input.note?.trim() || null,
      summary: input.summary?.trim() || null,
      work_done: input.work_done?.trim() || null,
      blockers: input.blockers?.trim() || null,
      weather: input.weather?.trim() || null,
      media_refs: input.media_refs ?? [],
      created_by: userId,
    })
    .select(LOG_SELECT)
    .single();
  if (error || !data) return null;
  return normalizeRow(data as Record<string, unknown>);
}

export async function updateDraft(
  supabase: SupabaseClient,
  logId: string,
  tenantId: string,
  input: UpdateFieldDailyLogDraftInput
): Promise<FieldDailyLog | null> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.work_date !== undefined) payload.work_date = input.work_date;
  if (input.note !== undefined) payload.note = input.note?.trim() || null;
  if (input.summary !== undefined) payload.summary = input.summary?.trim() || null;
  if (input.work_done !== undefined) payload.work_done = input.work_done?.trim() || null;
  if (input.blockers !== undefined) payload.blockers = input.blockers?.trim() || null;
  if (input.weather !== undefined) payload.weather = input.weather?.trim() || null;
  if (input.media_refs !== undefined) payload.media_refs = input.media_refs;

  const { data, error } = await supabase
    .from("field_daily_logs")
    .update(payload)
    .eq("id", logId)
    .eq("tenant_id", tenantId)
    .eq("status", "draft")
    .select(LOG_SELECT)
    .single();
  if (error || !data) return null;
  return normalizeRow(data as Record<string, unknown>);
}

export async function confirm(
  supabase: SupabaseClient,
  logId: string,
  tenantId: string,
  confirmedBy: string | null
): Promise<FieldDailyLog | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("field_daily_logs")
    .update({
      status: "confirmed",
      confirmed_at: now,
      confirmed_by: confirmedBy,
      updated_at: now,
    })
    .eq("id", logId)
    .eq("tenant_id", tenantId)
    .eq("status", "draft")
    .select(LOG_SELECT)
    .single();
  if (error || !data) return null;
  return normalizeRow(data as Record<string, unknown>);
}
