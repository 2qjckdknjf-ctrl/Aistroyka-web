/**
 * Data consistency checks for reliability. Surfaces projects/tasks/reports/evidence/alerts issues.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DataCheckIssue {
  kind: string;
  id?: string;
  message: string;
  count?: number;
}

export interface DataChecksResult {
  ok: boolean;
  issues: DataCheckIssue[];
  at: string;
}

/**
 * Run consistency checks. Best-effort; returns empty issues on DB errors.
 */
export async function runDataChecks(supabase: SupabaseClient): Promise<DataChecksResult> {
  const at = new Date().toISOString();
  const issues: DataCheckIssue[] = [];

  try {
    const [projectsWithoutTasks, tasksWithoutReports, tasksMissingPhotos, alertsWithoutRef] =
      await Promise.all([
        findProjectsWithoutTasks(supabase),
        findTasksWithoutReports(supabase),
        findTasksRequiringEvidenceWithoutPhotos(supabase),
        findAlertsWithoutReferences(supabase),
      ]);

    if (projectsWithoutTasks.length > 0) {
      issues.push({
        kind: "projects_without_tasks",
        message: `${projectsWithoutTasks.length} project(s) have no tasks`,
        count: projectsWithoutTasks.length,
      });
    }
    if (tasksWithoutReports.length > 0) {
      issues.push({
        kind: "tasks_without_reports",
        message: `${tasksWithoutReports.length} task(s) have no reports`,
        count: tasksWithoutReports.length,
      });
    }
    if (tasksMissingPhotos.length > 0) {
      issues.push({
        kind: "tasks_requiring_evidence_without_photos",
        message: `${tasksMissingPhotos.length} task(s) require evidence but have no photos`,
        count: tasksMissingPhotos.length,
      });
    }
    if (alertsWithoutRef > 0) {
      issues.push({
        kind: "alerts_without_references",
        message: `${alertsWithoutRef} alert(s) have no tenant reference`,
        count: alertsWithoutRef,
      });
    }
  } catch {
    issues.push({ kind: "check_error", message: "Data checks failed to run." });
  }

  return { ok: issues.length === 0, issues, at };
}

async function findProjectsWithoutTasks(supabase: SupabaseClient): Promise<string[]> {
  const { data: projects, error: e1 } = await supabase.from("projects").select("id");
  if (e1 || !projects?.length) return [];
  const ids = (projects as { id: string }[]).map((p) => p.id);
  const { data: taskProjectIds, error: e2 } = await supabase
    .from("worker_tasks")
    .select("project_id")
    .in("project_id", ids);
  if (e2) return [];
  const withTasks = new Set((taskProjectIds as { project_id: string }[]).map((r) => r.project_id));
  return ids.filter((id) => !withTasks.has(id));
}

async function findTasksWithoutReports(supabase: SupabaseClient): Promise<string[]> {
  const { data: tasks, error: e1 } = await supabase.from("worker_tasks").select("id");
  if (e1 || !tasks?.length) return [];
  const taskIds = (tasks as { id: string }[]).map((t) => t.id);
  const { data: reported, error: e2 } = await supabase
    .from("worker_reports")
    .select("task_id")
    .in("task_id", taskIds);
  if (e2) return taskIds;
  const reportedSet = new Set((reported as { task_id: string }[]).map((r) => r.task_id));
  return taskIds.filter((id) => !reportedSet.has(id));
}

async function findTasksRequiringEvidenceWithoutPhotos(supabase: SupabaseClient): Promise<string[]> {
  const { data: tasks, error: e1 } = await supabase
    .from("worker_tasks")
    .select("id")
    .gt("required_photos", 0);
  if (e1 || !tasks?.length) return [];
  const taskIds = (tasks as { id: string }[]).map((t) => t.id);
  const { data: reportRows, error: e2 } = await supabase
    .from("worker_reports")
    .select("id, task_id")
    .in("task_id", taskIds);
  if (e2 || !reportRows?.length) return taskIds;
  const reportIds = (reportRows as { id: string; task_id: string }[]).map((r) => r.id);
  const reportToTask = new Map(
    (reportRows as { id: string; task_id: string }[]).map((r) => [r.id, r.task_id])
  );
  const { data: media, error: e3 } = await supabase
    .from("worker_report_media")
    .select("report_id")
    .in("report_id", reportIds);
  if (e3) return taskIds;
  const reportsWithMedia = new Set((media as { report_id: string }[]).map((m) => m.report_id));
  const tasksWithPhotos = new Set<string>();
  for (const rid of reportsWithMedia) {
    const tid = reportToTask.get(rid);
    if (tid) tasksWithPhotos.add(tid);
  }
  return taskIds.filter((id) => !tasksWithPhotos.has(id));
}

async function findAlertsWithoutReferences(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .is("tenant_id", null);
  if (error) return 0;
  return typeof count === "number" ? count : 0;
}
