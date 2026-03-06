import type { SupabaseClient } from "@supabase/supabase-js";
import { logStructured } from "@/lib/observability";

const STUCK_UPLOAD_HOURS = 4;

export interface OpsOverviewKpis {
  activeProjects: number;
  activeWorkersToday: number;
  reportsToday: number;
  stuckUploads: number;
  offlineDevices: number;
  failedJobs24h: number;
  /** Phase 7.6: task compliance */
  tasks_assigned_today?: number;
  tasks_completed_today?: number;
  tasks_open_today?: number;
  tasks_overdue?: number;
}

export interface OpsOverviewQueues {
  reportsPendingReview: { id: string; status: string; created_at: string }[];
  stuckUploads: { id: string; status: string; created_at: string }[];
  workersOpenShift: { user_id: string; day_date: string }[];
  /** Phase 7.5: open shift but no report submitted today (report compliance). */
  workersOpenShiftNoReportToday: { user_id: string; day_date: string }[];
  pushFailed: { id: string; attempts: number }[];
  aiFailed: { id: string; status: string; created_at: string }[];
  /** Phase 7.6: open tasks due today; deep link to /dashboard/tasks */
  tasksOpenToday?: { id: string; title: string; due_date: string }[];
  /** Phase 7.6: overdue tasks */
  tasksOverdue?: { id: string; title: string; due_date: string }[];
}

export interface OpsOverview {
  kpis: OpsOverviewKpis;
  queues: OpsOverviewQueues;
}

const AI_JOB_TYPES = ["ai_analyze_media", "ai_analyze_report"];

export async function getOpsOverview(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { projectId?: string; from?: string; to?: string; limit?: number } = {}
): Promise<OpsOverview> {
  const limit = Math.min(opts.limit ?? 10, 20);
  const today = new Date().toISOString().slice(0, 10);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const stuckSince = new Date(Date.now() - STUCK_UPLOAD_HOURS * 60 * 60 * 1000).toISOString();
  const from = opts.from ?? today;
  const to = opts.to ?? new Date().toISOString();

  const [
    projectsRes,
    workersTodayRes,
    reportsTodayRes,
    stuckUploadsCountRes,
    stuckUploadsListRes,
    failedJobsRes,
    reportsPendingRes,
    workersOpenRes,
    usersWithReportTodayRes,
    pushFailedRes,
    aiFailedRes,
    tasksAssignedTodayRes,
    tasksCompletedTodayRes,
    tasksOpenTodayListRes,
    tasksOverdueListRes,
  ] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("worker_day").select("user_id").eq("tenant_id", tenantId).eq("day_date", today),
    supabase
      .from("worker_reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("submitted_at", today),
    supabase
      .from("upload_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["created", "uploaded"])
      .lt("created_at", stuckSince),
    supabase
      .from("upload_sessions")
      .select("id, status, created_at")
      .eq("tenant_id", tenantId)
      .in("status", ["created", "uploaded"])
      .lt("created_at", stuckSince)
      .order("created_at", { ascending: true })
      .limit(limit),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["failed", "dead"])
      .gte("created_at", since24h),
    supabase
      .from("worker_reports")
      .select("id, status, created_at")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("worker_day")
      .select("user_id, day_date")
      .eq("tenant_id", tenantId)
      .not("started_at", "is", null)
      .is("ended_at", null)
      .gte("day_date", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .limit(limit),
    supabase
      .from("worker_reports")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .not("submitted_at", "is", null)
      .gte("submitted_at", today),
    supabase
      .from("push_outbox")
      .select("id, attempts")
      .eq("tenant_id", tenantId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("jobs")
      .select("id, status, created_at")
      .eq("tenant_id", tenantId)
      .in("type", AI_JOB_TYPES)
      .in("status", ["failed", "dead"])
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(limit),
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
      .select("id, title, due_date")
      .eq("tenant_id", tenantId)
      .eq("due_date", today)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true })
      .limit(limit),
    supabase
      .from("worker_tasks")
      .select("id, title, due_date")
      .eq("tenant_id", tenantId)
      .lt("due_date", today)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true })
      .limit(limit),
  ]);

  const activeWorkersToday = new Set((workersTodayRes.data ?? []) as { user_id: string }[]).size;
  const reportsTodayCount = reportsTodayRes.count ?? 0;
  const stuckUploadsCount = stuckUploadsCountRes.count ?? 0;
  const offlineDevices = 0;
  const workersOpen = (workersOpenRes.data ?? []) as { user_id: string; day_date: string }[];
  const usersWithReportToday = new Set(
    ((usersWithReportTodayRes.data ?? []) as { user_id: string }[]).map((r) => r.user_id)
  );
  const workersOpenShiftNoReportToday = workersOpen.filter((w) => !usersWithReportToday.has(w.user_id));

  if (stuckUploadsCount > 0) {
    logStructured({
      event: "ops_overview_stuck_calculation",
      tenant_id: tenantId,
      stuck_uploads_count: stuckUploadsCount,
    });
  }

  const tasksOpenTodayList = (tasksOpenTodayListRes.data ?? []) as { id: string; title: string; due_date: string }[];
  const tasksOverdueList = (tasksOverdueListRes.data ?? []) as { id: string; title: string; due_date: string }[];

  return {
    kpis: {
      activeProjects: projectsRes.count ?? 0,
      activeWorkersToday,
      reportsToday: reportsTodayCount,
      stuckUploads: stuckUploadsCount,
      offlineDevices,
      failedJobs24h: failedJobsRes.count ?? 0,
      tasks_assigned_today: tasksAssignedTodayRes.count ?? 0,
      tasks_completed_today: tasksCompletedTodayRes.count ?? 0,
      tasks_open_today: tasksOpenTodayList.length,
      tasks_overdue: tasksOverdueList.length,
    },
    queues: {
      reportsPendingReview: (reportsPendingRes.data ?? []) as { id: string; status: string; created_at: string }[],
      stuckUploads: (stuckUploadsListRes.data ?? []) as { id: string; status: string; created_at: string }[],
      workersOpenShift: workersOpen,
      workersOpenShiftNoReportToday,
      pushFailed: (pushFailedRes.data ?? []) as { id: string; attempts: number }[],
      aiFailed: (aiFailedRes.data ?? []) as { id: string; status: string; created_at: string }[],
      tasksOpenToday: tasksOpenTodayList,
      tasksOverdue: tasksOverdueList,
    },
  };
}
