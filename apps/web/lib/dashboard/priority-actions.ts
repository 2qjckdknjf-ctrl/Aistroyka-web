/**
 * Build priority action items from ops overview data.
 * Used by DashboardPriorityActionsClient.
 * Ordering: manager urgency — overdue & failed jobs first, then approvals & workers, then due-today & uploads.
 */

export interface OpsOverviewForPriority {
  kpis: {
    tasks_overdue?: number;
    tasks_open_today?: number;
    stuckUploads: number;
    failedJobs24h: number;
  };
  queues: {
    tasksOverdue?: { id: string; title: string; due_date: string }[];
    tasksOpenToday?: { id: string; title: string; due_date: string }[];
    reportsPendingReview: { id: string }[];
    workersOpenShiftNoReportToday?: { user_id: string; day_date: string }[];
    stuckUploads: { id: string }[];
    aiFailed?: { id: string }[];
  };
}

export interface PriorityItem {
  id: string;
  title: string;
  reason: string;
  href: string;
  priority: "high" | "medium" | "low";
}

interface PriorityItemInternal extends PriorityItem {
  sortKey: number;
}

const SK_OVERDUE = 0;
const SK_AI_FAILED = 1;
const SK_STUCK_UPLOAD = 2;
const SK_REPORT = 10;
const SK_WORKER_NOREPORT = 11;
const SK_OPEN_TODAY = 20;

export function buildPriorityItems(data: OpsOverviewForPriority): PriorityItem[] {
  const items: PriorityItemInternal[] = [];

  for (const t of data.queues.tasksOverdue ?? []) {
    items.push({
      id: `overdue-${t.id}`,
      title: t.title.slice(0, 40) + (t.title.length > 40 ? "…" : ""),
      reason: "Task past due date",
      href: `/dashboard/tasks/${t.id}`,
      priority: "high",
      sortKey: SK_OVERDUE,
    });
  }

  if (data.kpis.failedJobs24h > 0) {
    items.push({
      id: "ai-failed",
      title: `${data.kpis.failedJobs24h} AI job(s) failed (24h)`,
      reason: "Review failures and retry or fix inputs",
      href: "/dashboard/ai?status=failed",
      priority: "high",
      sortKey: SK_AI_FAILED,
    });
  }

  if (data.kpis.stuckUploads > 0) {
    items.push({
      id: "stuck-uploads",
      title: `${data.kpis.stuckUploads} upload(s) stuck >4h`,
      reason: "May block analysis — check media pipeline",
      href: "/dashboard/uploads?stuck=1",
      priority: "medium",
      sortKey: SK_STUCK_UPLOAD,
    });
  }

  for (const r of data.queues.reportsPendingReview.slice(0, 3)) {
    items.push({
      id: `report-${r.id}`,
      title: `Report pending approval`,
      reason: `Report ${r.id.slice(0, 8)}… needs review`,
      href: `/dashboard/reports/${r.id}`,
      priority: "medium",
      sortKey: SK_REPORT + items.filter((i) => i.id.startsWith("report-")).length,
    });
  }

  for (const w of (data.queues.workersOpenShiftNoReportToday ?? []).slice(0, 3)) {
    items.push({
      id: `noreport-${w.user_id}-${w.day_date}`,
      title: `Shift open — no report (${w.day_date})`,
      reason: `Worker ${w.user_id.slice(0, 8)}…`,
      href: `/dashboard/workers/${w.user_id}`,
      priority: "medium",
      sortKey: SK_WORKER_NOREPORT,
    });
  }

  for (const t of (data.queues.tasksOpenToday ?? []).slice(0, 3)) {
    if (!items.some((i) => i.id === `open-${t.id}`)) {
      items.push({
        id: `open-${t.id}`,
        title: t.title.slice(0, 40) + (t.title.length > 40 ? "…" : ""),
        reason: "Due today",
        href: `/dashboard/tasks/${t.id}`,
        priority: "medium",
        sortKey: SK_OPEN_TODAY,
      });
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items
    .sort((a, b) => {
      const p = order[a.priority] - order[b.priority];
      if (p !== 0) return p;
      return a.sortKey - b.sortKey;
    })
    .slice(0, 7)
    .map(({ sortKey: _s, ...rest }) => rest);
}

/** True when overview loaded but queues are empty (not the same as “all clear” if fetch failed — caller decides). */
export function hasOpsData(data: OpsOverviewForPriority): boolean {
  const q = data.queues;
  return (
    (q.tasksOverdue?.length ?? 0) > 0 ||
    (q.tasksOpenToday?.length ?? 0) > 0 ||
    q.reportsPendingReview.length > 0 ||
    (q.workersOpenShiftNoReportToday?.length ?? 0) > 0 ||
    q.stuckUploads.length > 0 ||
    (q.aiFailed?.length ?? 0) > 0 ||
    data.kpis.stuckUploads > 0 ||
    data.kpis.failedJobs24h > 0
  );
}
