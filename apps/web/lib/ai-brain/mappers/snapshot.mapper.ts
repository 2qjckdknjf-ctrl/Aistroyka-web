/**
 * Maps existing DB/repo data to ProjectSnapshot.
 * Single place to assemble project snapshot for the brain.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectSnapshot } from "../domain";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";

export async function buildProjectSnapshot(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectSnapshot | null> {
  const project = await getProjectById(supabase, projectId, tenantId);
  if (!project) return null;

  // Health is exposed as authoritative project intelligence, so its critical source
  // tables must be readable before aggregate helpers are allowed to turn failures into
  // zero-like values. Any RLS/schema/database failure aborts snapshot construction.
  const [workerDaysCheck, reportsCheck] = await Promise.all([
    supabase
      .from("worker_day")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_reports")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["draft", "submitted"]),
  ]);
  if (workerDaysCheck.error) throw new Error("project_snapshot_worker_days_query_failed");
  if (reportsCheck.error) throw new Error("project_snapshot_reports_query_failed");

  const summary = await getProjectSummary(supabase, projectId, tenantId);

  const today = new Date().toISOString().slice(0, 10);
  const tasksRes = await supabase
    .from("worker_tasks")
    .select("id, status, due_date")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  if (tasksRes.error) throw new Error("project_snapshot_tasks_query_failed");
  const tasks = (tasksRes.data ?? []) as { id: string; status: string; due_date: string | null }[];
  const overdueTaskCount = tasks.filter(
    (t) => t.status !== "done" && t.due_date && t.due_date < today
  ).length;
  const completedTaskCount = tasks.filter((t) => t.status === "done").length;

  const mediaCountRes = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  if (mediaCountRes.error) throw new Error("project_snapshot_media_count_query_failed");

  const mediaRowsRes = await supabase
    .from("media")
    .select("id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  if (mediaRowsRes.error) throw new Error("project_snapshot_media_query_failed");
  const mediaIds = (mediaRowsRes.data ?? []).map((m: { id: string }) => m.id);
  let analysisCountVal = 0;
  if (mediaIds.length > 0) {
    const analysisRes = await supabase
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .in("media_id", mediaIds);
    if (analysisRes.error) throw new Error("project_snapshot_analysis_query_failed");
    analysisCountVal = analysisRes.count ?? 0;
  }

  const at = new Date().toISOString();
  return {
    projectId,
    tenantId,
    at,
    workerCount: summary.activeWorkers,
    reportCount: summary.openReports + 0,
    openReportCount: summary.openReports,
    taskCount: tasks.length,
    overdueTaskCount,
    completedTaskCount,
    mediaCount: mediaCountRes.count ?? 0,
    analysisCount: analysisCountVal,
  };
}
