import type { SupabaseClient } from "@supabase/supabase-js";
import type { Report } from "./report.types";

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayId?: string | null
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("worker_reports")
    .insert({ tenant_id: tenantId, user_id: userId, day_id: dayId ?? null, status: "draft" })
    .select("id, tenant_id, user_id, day_id, status, created_at, submitted_at")
    .single();
  if (error || !data) return null;
  return data as Report;
}

export async function getById(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("worker_reports")
    .select("id, tenant_id, user_id, day_id, status, created_at, submitted_at")
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Report;
}

export async function addMedia(
  supabase: SupabaseClient,
  reportId: string,
  opts: { mediaId?: string; uploadSessionId?: string }
): Promise<boolean> {
  const { mediaId, uploadSessionId } = opts;
  if (!mediaId && !uploadSessionId) return false;
  const { error } = await supabase.from("worker_report_media").insert({
    report_id: reportId,
    media_id: mediaId ?? null,
    upload_session_id: uploadSessionId ?? null,
    sort_order: 0,
  });
  return !error;
}

export async function submit(supabase: SupabaseClient, reportId: string, tenantId: string): Promise<boolean> {
  const { error } = await supabase
    .from("worker_reports")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .eq("status", "draft");
  return !error;
}

export interface ReportMediaRow {
  media_id: string | null;
  upload_session_id: string | null;
}

export async function listMediaByReportId(
  supabase: SupabaseClient,
  reportId: string,
  _tenantId: string
): Promise<ReportMediaRow[]> {
  const { data, error } = await supabase
    .from("worker_report_media")
    .select("media_id, upload_session_id")
    .eq("report_id", reportId);
  if (error) return [];
  return (data ?? []) as ReportMediaRow[];
}
