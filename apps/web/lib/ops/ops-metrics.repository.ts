/**
 * Lightweight aggregated metrics for cockpit dashboards.
 * Counts only; no full row scans. Tenant-scoped, optional from/to/project_id.
 * uploads_stuck: status in (created, uploaded) AND created_at < now() - UPLOAD_STUCK_HOURS.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_STUCK_HOURS = 4;
const DEFAULT_DEVICE_OFFLINE_HOURS = 24;
const AI_JOB_TYPES = ["ai_analyze_media", "ai_analyze_report"];

function getStuckHours(): number {
  const v = process.env.UPLOAD_STUCK_HOURS;
  if (v == null || v === "") return DEFAULT_STUCK_HOURS;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 168) : DEFAULT_STUCK_HOURS;
}

function getDeviceOfflineHours(): number {
  const v = process.env.DEVICE_OFFLINE_HOURS;
  if (v == null || v === "") return DEFAULT_DEVICE_OFFLINE_HOURS;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 720) : DEFAULT_DEVICE_OFFLINE_HOURS;
}

export interface OpsMetrics {
  uploads_stuck: number;
  uploads_expired: number;
  devices_offline: number;
  sync_conflicts: number;
  ai_failed: number;
  jobs_failed: number;
  push_failed: number;
  /** Phase 7.6: task compliance */
  tasks_assigned_today: number;
  tasks_completed_today: number;
  tasks_open_today: number;
  tasks_overdue: number;
}

export async function getOpsMetrics(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { from?: string; to?: string; project_id?: string } = {}
): Promise<OpsMetrics> {
  const now = new Date().toISOString();
  const from = opts.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = opts.to ?? now;
  const stuckHours = getStuckHours();
  const stuckSince = new Date(Date.now() - stuckHours * 60 * 60 * 1000).toISOString();
  const offlineHours = getDeviceOfflineHours();
  const offlineSince = new Date(Date.now() - offlineHours * 60 * 60 * 1000).toISOString();

  const today = now.slice(0, 10);
  const [
    stuckRes,
    expiredRes,
    devicesOfflineRes,
    syncConflictsRes,
    jobsFailedRes,
    aiFailedRes,
    pushFailedRes,
    tasksAssignedTodayRes,
    tasksCompletedTodayRes,
    tasksOpenTodayRes,
    tasksOverdueRes,
  ] = await Promise.all([
    supabase
      .from("upload_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["created", "uploaded"])
      .lt("created_at", stuckSince),
    supabase
      .from("upload_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "expired")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase.rpc("get_offline_device_count", { p_tenant_id: tenantId, p_since: offlineSince }),
    supabase
      .from("ops_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("type", "sync_conflict")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["failed", "dead"])
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("type", AI_JOB_TYPES)
      .in("status", ["failed", "dead"])
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("push_outbox")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "failed")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("task_assignments")
      .select("task_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("assigned_at", today)
      .lt("assigned_at", today + "T23:59:59.999Z"),
    supabase
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "done")
      .gte("updated_at", today)
      .lt("updated_at", today + "T23:59:59.999Z"),
    supabase
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("due_date", today)
      .in("status", ["pending", "in_progress"]),
    supabase
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .lt("due_date", today)
      .in("status", ["pending", "in_progress"]),
  ]);

  return {
    uploads_stuck: stuckRes.count ?? 0,
    uploads_expired: expiredRes.count ?? 0,
    devices_offline: typeof devicesOfflineRes.data === "number" ? devicesOfflineRes.data : 0,
    sync_conflicts: syncConflictsRes.count ?? 0,
    ai_failed: aiFailedRes.count ?? 0,
    jobs_failed: jobsFailedRes.count ?? 0,
    push_failed: pushFailedRes.count ?? 0,
    tasks_assigned_today: tasksAssignedTodayRes.count ?? 0,
    tasks_completed_today: tasksCompletedTodayRes.count ?? 0,
    tasks_open_today: tasksOpenTodayRes.count ?? 0,
    tasks_overdue: tasksOverdueRes.count ?? 0,
  };
}
