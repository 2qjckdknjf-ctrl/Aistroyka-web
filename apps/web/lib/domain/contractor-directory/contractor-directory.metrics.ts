import type { ContractorQualityMetrics } from "./contractor-directory.types";

type TaskRow = {
  assigned_to: string | null;
  status: string;
  due_date: string | null;
  updated_at: string;
};

type ReportRow = {
  user_id: string;
  status: string;
};

function delayDaysForTask(t: TaskRow): number | null {
  if (t.status !== "done" || !t.due_date) return null;
  const due = new Date(`${t.due_date}T00:00:00Z`).getTime();
  const done = new Date(t.updated_at).getTime();
  if (Number.isNaN(due) || Number.isNaN(done)) return null;
  return (done - due) / (24 * 3600 * 1000);
}

export function aggregateContractorMetrics(
  userId: string,
  tasks: TaskRow[],
  reports: ReportRow[],
  activeProjectIds: Set<string>
): ContractorQualityMetrics {
  const myTasks = tasks.filter((t) => t.assigned_to === userId);
  const tasks_completed = myTasks.filter((t) => t.status === "done").length;
  const tasks_in_progress = myTasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;

  const delays: number[] = [];
  for (const t of myTasks) {
    const d = delayDaysForTask(t);
    if (d != null) delays.push(d);
  }
  const average_delay_days =
    delays.length === 0 ? null : delays.reduce((a, b) => a + b, 0) / delays.length;

  const myReports = reports.filter((r) => r.user_id === userId);
  const nonDraft = myReports.filter((r) => r.status !== "draft");
  const reports_submitted = nonDraft.length;
  const reports_approved = myReports.filter((r) => r.status === "approved").length;
  const reports_rejected = myReports.filter((r) => r.status === "rejected").length;
  const reports_changes_requested = myReports.filter((r) => r.status === "changes_requested").length;

  const reviewed = reports_approved + reports_rejected;
  const rejection_rate = reviewed === 0 ? 0 : reports_rejected / reviewed;

  const missing_evidence_rate =
    nonDraft.length === 0 ? 0 : reports_changes_requested / nonDraft.length;

  const active_projects = activeProjectIds.size;

  const r = rejection_rate;
  const m = missing_evidence_rate;
  const d = average_delay_days == null ? 0 : Math.max(0, average_delay_days);
  const raw = 100 - 42 * r - 28 * m - 1.8 * Math.min(d, 14);
  const quality_score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    tasks_completed,
    tasks_in_progress,
    reports_submitted,
    reports_approved,
    reports_rejected,
    reports_changes_requested,
    active_projects,
    rejection_rate,
    missing_evidence_rate,
    average_delay_days,
    quality_score,
  };
}

export function buildMetricsMap(params: {
  userIds: string[];
  tasks: TaskRow[];
  reports: ReportRow[];
  memberships: { user_id: string; project_id: string }[];
}): Map<string, ContractorQualityMetrics> {
  const projectSets = new Map<string, Set<string>>();
  for (const m of params.memberships) {
    if (!projectSets.has(m.user_id)) projectSets.set(m.user_id, new Set());
    projectSets.get(m.user_id)!.add(m.project_id);
  }
  const map = new Map<string, ContractorQualityMetrics>();
  for (const uid of params.userIds) {
    map.set(uid, aggregateContractorMetrics(uid, params.tasks, params.reports, projectSets.get(uid) ?? new Set()));
  }
  return map;
}
