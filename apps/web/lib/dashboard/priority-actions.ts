/**
 * Build priority action items from ops overview data.
 * Used by DashboardPriorityActionsClient.
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

export function buildPriorityItems(data: OpsOverviewForPriority): PriorityItem[] {
  const items: PriorityItem[] = [];

  for (const t of data.queues.tasksOverdue ?? []) {
    items.push({
      id: `overdue-${t.id}`,
      title: t.title.slice(0, 40) + (t.title.length > 40 ? "…" : ""),
      reason: "Overdue task",
      href: `/dashboard/tasks/${t.id}`,
      priority: "high",
    });
  }

  for (const t of (data.queues.tasksOpenToday ?? []).slice(0, 2)) {
    if (!items.some((i) => i.id === `open-${t.id}`)) {
      items.push({
        id: `open-${t.id}`,
        title: t.title.slice(0, 40) + (t.title.length > 40 ? "…" : ""),
        reason: "Task due today",
        href: `/dashboard/tasks/${t.id}`,
        priority: "medium",
      });
    }
  }

  for (const r of data.queues.reportsPendingReview.slice(0, 2)) {
    items.push({
      id: `report-${r.id}`,
      title: `Report ${r.id.slice(0, 8)}…`,
      reason: "Pending review",
      href: `/dashboard/reports/${r.id}`,
      priority: "medium",
    });
  }

  for (const w of (data.queues.workersOpenShiftNoReportToday ?? []).slice(0, 2)) {
    items.push({
      id: `noreport-${w.user_id}-${w.day_date}`,
      title: `Worker ${w.user_id.slice(0, 8)}… (${w.day_date})`,
      reason: "Open shift, no report today",
      href: `/dashboard/workers/${w.user_id}`,
      priority: "medium",
    });
  }

  if (data.kpis.stuckUploads > 0 && items.length < 5) {
    items.push({
      id: "stuck-uploads",
      title: `${data.kpis.stuckUploads} stuck upload(s)`,
      reason: "Uploads pending >4h",
      href: "/dashboard/uploads?stuck=1",
      priority: "medium",
    });
  }

  if (data.kpis.failedJobs24h > 0 && items.length < 5) {
    items.push({
      id: "ai-failed",
      title: `${data.kpis.failedJobs24h} failed AI job(s)`,
      reason: "Jobs failed in last 24h",
      href: "/dashboard/ai?status=failed",
      priority: "high",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 7);
}
