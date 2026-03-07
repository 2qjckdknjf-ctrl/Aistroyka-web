import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkerReportDelta {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
}

export interface UploadSessionDelta {
  id: string;
  status: string;
  created_at: string;
}

export async function listReportsForSync(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  limit: number = 50
): Promise<WorkerReportDelta[]> {
  const { data, error } = await supabase
    .from("worker_reports")
    .select("id, status, created_at, submitted_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as WorkerReportDelta[];
}

export async function listUploadSessionsForSync(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  limit: number = 50
): Promise<UploadSessionDelta[]> {
  const { data, error } = await supabase
    .from("upload_sessions")
    .select("id, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as UploadSessionDelta[];
}
