import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectSummary {
  activeWorkers: number;
  openReports: number;
  aiAnalyses: number;
}

/**
 * Read-only aggregate counts for a project (tenant-scoped).
 * Used by dashboard project detail. RLS enforces tenant isolation.
 */
export async function getProjectSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectSummary> {
  const [{ data: workerDays }, dayIdsRes] = await Promise.all([
    supabase
      .from("worker_day")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_day")
      .select("id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
  ]);

  const activeWorkers = new Set((workerDays ?? []).map((r) => r.user_id)).size;

  let openReports = 0;
  const dayIds = dayIdsRes.data ?? [];
  if (dayIds.length > 0) {
    const { count } = await supabase
      .from("worker_reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["draft", "submitted"])
      .in("day_id", dayIds.map((d) => d.id));
    openReports = count ?? 0;
  }

  let aiAnalyses = 0;
  const { data: mediaRows } = await supabase
    .from("media")
    .select("id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  if (mediaRows?.length) {
    const { count } = await supabase
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .in("media_id", mediaRows.map((m) => m.id));
    aiAnalyses = count ?? 0;
  }

  return { activeWorkers, openReports, aiAnalyses };
}
