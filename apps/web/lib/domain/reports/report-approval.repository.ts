import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportApprovalEventType = "submitted" | "approved" | "rejected" | "changes_requested";

export interface ReportApprovalEventRow {
  id: string;
  tenant_id: string;
  report_id: string;
  event_type: ReportApprovalEventType;
  actor_user_id: string | null;
  note: string | null;
  created_at: string;
}

/** Append-only governance record. Best-effort: returns false without throwing. */
export async function insertReportApprovalEvent(
  supabase: SupabaseClient,
  tenantId: string,
  reportId: string,
  eventType: ReportApprovalEventType,
  actorUserId: string,
  note?: string | null
): Promise<boolean> {
  const { error } = await supabase.from("report_approval_events").insert({
    tenant_id: tenantId,
    report_id: reportId,
    event_type: eventType,
    actor_user_id: actorUserId,
    note: note ?? null,
  });
  return !error;
}

export async function listReportApprovalEvents(
  supabase: SupabaseClient,
  tenantId: string,
  reportId: string,
  limit: number = 100
): Promise<ReportApprovalEventRow[]> {
  const { data, error } = await supabase
    .from("report_approval_events")
    .select("id, tenant_id, report_id, event_type, actor_user_id, note, created_at")
    .eq("tenant_id", tenantId)
    .eq("report_id", reportId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ReportApprovalEventRow[];
}

/**
 * Submitted reports awaiting manager decision, scoped to a project (task-linked or day-linked).
 */
export async function countSubmittedReportsForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<number> {
  const [{ data: taskRows }, { data: dayRows }] = await Promise.all([
    supabase.from("worker_tasks").select("id").eq("tenant_id", tenantId).eq("project_id", projectId),
    supabase.from("worker_day").select("id").eq("tenant_id", tenantId).eq("project_id", projectId),
  ]);
  const taskIds = (taskRows ?? []).map((r: { id: string }) => r.id);
  const dayIds = (dayRows ?? []).map((r: { id: string }) => r.id);
  if (taskIds.length === 0 && dayIds.length === 0) return 0;

  const seen = new Set<string>();
  if (taskIds.length > 0) {
    const { data: r1 } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .in("task_id", taskIds);
    for (const r of (r1 ?? []) as { id: string }[]) seen.add(r.id);
  }
  if (dayIds.length > 0) {
    const { data: r2 } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .in("day_id", dayIds);
    for (const r of (r2 ?? []) as { id: string }[]) seen.add(r.id);
  }
  return seen.size;
}
