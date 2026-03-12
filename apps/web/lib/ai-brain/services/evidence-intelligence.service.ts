/**
 * Evidence intelligence: photo/evidence coverage signals.
 * Identifies missing or partial evidence. Scaffold: deterministic from DB.
 * Uses worker_report_media and worker_reports.task_id for task-linked evidence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceSignal } from "../domain";

function requiredPhotoCount(required_photos: unknown): number {
  if (!required_photos || typeof required_photos !== "object") return 0;
  return Object.values(required_photos as Record<string, number>).reduce((a, b) => a + Number(b), 0);
}

export async function getEvidenceSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<EvidenceSignal[]> {
  const at = new Date().toISOString();
  const signals: EvidenceSignal[] = [];

  const { data: tasks } = await supabase
    .from("worker_tasks")
    .select("id, required_photos, title")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"]);

  if (!tasks?.length) return signals;

  for (const task of tasks as { id: string; required_photos: unknown; title: string }[]) {
    const required = requiredPhotoCount(task.required_photos);
    if (required === 0) continue;

    const { data: reportRows } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("task_id", task.id);
    const reportIds = (reportRows ?? []).map((r: { id: string }) => r.id);
    let actual = 0;
    if (reportIds.length > 0) {
      const { data: rm } = await supabase
        .from("worker_report_media")
        .select("media_id")
        .in("report_id", reportIds);
      actual = new Set((rm ?? []).map((x: { media_id: string }) => x.media_id)).size;
    }
    if (actual < required) {
      signals.push({
        projectId,
        taskId: task.id,
        type: "partial",
        severity: required - actual > 2 ? "high" : "medium",
        required,
        actual,
        message: `Task "${task.title}" has ${actual}/${required} evidence`,
        at,
      });
    }
  }

  return signals;
}
