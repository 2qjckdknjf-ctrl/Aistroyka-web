import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkerSummary {
  reports_count: number;
  media_count: number;
}

export async function getWorkerSummary(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<WorkerSummary> {
  // Get reports count
  const { data: reportRows, count: reportsCount } = await supabase
    .from("worker_reports")
    .select("id", { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .limit(5000);

  const reportIds = (reportRows ?? []).map((r) => (r as { id: string }).id);
  let mediaCount = 0;

  if (reportIds.length > 0) {
    const { count } = await supabase
      .from("worker_report_media")
      .select("id", { count: "exact", head: true })
      .in("report_id", reportIds);
    mediaCount = count ?? 0;
  }

  return {
    reports_count: reportsCount ?? 0,
    media_count: mediaCount,
  };
}
