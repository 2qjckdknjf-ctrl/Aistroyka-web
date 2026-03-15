/**
 * Report quality scoring: transparent, modest assessment.
 * Uses: report media count vs task required_photos; reports with task but no media.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReportQualitySignal {
  reportId: string;
  taskId: string | null;
  projectId: string;
  mediaCount: number;
  requiredPhotos: number;
  score: number;
  message: string;
  at: string;
}

function requiredPhotoCount(required_photos: unknown): number {
  if (!required_photos || typeof required_photos !== "object") return 0;
  return Object.values(required_photos as Record<string, number>).reduce(
    (a, b) => a + Number(b),
    0
  );
}

export async function getReportQualitySignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ReportQualitySignal[]> {
  const at = new Date().toISOString();
  const signals: ReportQualitySignal[] = [];

  const { data: projectTasks } = await supabase
    .from("worker_tasks")
    .select("id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  const taskIdsForProject = (projectTasks ?? []).map((t) => (t as { id: string }).id);
  if (taskIdsForProject.length === 0) return signals;

  const { data: reports } = await supabase
    .from("worker_reports")
    .select("id, task_id")
    .eq("tenant_id", tenantId)
    .in("status", ["draft", "submitted"])
    .in("task_id", taskIdsForProject);

  if (!reports?.length) return signals;

  const reportIds = (reports as { id: string; task_id: string | null }[]).map((r) => r.id);
  const { data: mediaRows } = await supabase
    .from("worker_report_media")
    .select("report_id, media_id")
    .in("report_id", reportIds);

  const mediaByReport = new Map<string, number>();
  for (const m of (mediaRows ?? []) as { report_id: string; media_id: string }[]) {
    const count = mediaByReport.get(m.report_id) ?? 0;
    if (m.media_id) mediaByReport.set(m.report_id, count + 1);
  }

  const taskIds = [
    ...new Set(
      (reports as { task_id: string | null }[])
        .map((r) => r.task_id)
        .filter((id): id is string => !!id && taskIdsForProject.includes(id))
    ),
  ];
  let taskRequired = new Map<string, number>();
  if (taskIds.length > 0) {
    const { data: tasks } = await supabase
      .from("worker_tasks")
      .select("id, required_photos")
      .in("id", taskIds);
    for (const t of (tasks ?? []) as { id: string; required_photos: unknown }[]) {
      taskRequired.set(t.id, requiredPhotoCount(t.required_photos));
    }
  }

  for (const r of reports as { id: string; task_id: string | null }[]) {
    const mediaCount = mediaByReport.get(r.id) ?? 0;
    const required = r.task_id ? (taskRequired.get(r.task_id) ?? 0) : 0;

    if (r.task_id && required > 0 && mediaCount < required) {
      const score = Math.round((mediaCount / required) * 100);
      signals.push({
        reportId: r.id,
        taskId: r.task_id,
        projectId,
        mediaCount,
        requiredPhotos: required,
        score,
        message: `Report has ${mediaCount}/${required} photos for linked task`,
        at,
      });
    } else if (r.task_id && mediaCount === 0) {
      signals.push({
        reportId: r.id,
        taskId: r.task_id,
        projectId,
        mediaCount: 0,
        requiredPhotos: 0,
        score: 0,
        message: "Report linked to task but has no media",
        at,
      });
    }
  }

  return signals;
}
