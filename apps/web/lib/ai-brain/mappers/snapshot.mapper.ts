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

  const summary = await getProjectSummary(supabase, projectId, tenantId);

  const today = new Date().toISOString().slice(0, 10);
  const { data: taskRows } = await supabase
    .from("worker_tasks")
    .select("id, status, due_date")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  const tasks = (taskRows ?? []) as { id: string; status: string; due_date: string | null }[];
  const overdueTaskCount = tasks.filter(
    (t) => t.status !== "completed" && t.due_date && t.due_date < today
  ).length;
  const completedTaskCount = tasks.filter((t) => t.status === "completed").length;

  const { count: mediaCount } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  const mediaIds = (mediaRows ?? []).map((m: { id: string }) => m.id);
  let analysisCountVal = 0;
  if (mediaIds.length > 0) {
    const { count } = await supabase
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .in("media_id", mediaIds);
    analysisCountVal = count ?? 0;
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
    mediaCount: mediaCount ?? 0,
    analysisCount: analysisCountVal,
  };
}
