/**
 * Evidence intelligence: photo/evidence coverage signals.
 * Identifies missing or partial evidence. Scaffold: deterministic from DB.
 * Uses worker_report_media and worker_reports.task_id for task-linked evidence.
 * Supports before/after when required_photos has {"before":N,"after":M} and
 * worker_report_media links to upload_sessions with purpose (report_before, report_after).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceSignal } from "../domain";

function requiredPhotoCount(required_photos: unknown): number {
  if (!required_photos || typeof required_photos !== "object") return 0;
  return Object.values(required_photos as Record<string, number>).reduce((a, b) => a + Number(b), 0);
}

function parseBeforeAfter(required_photos: unknown): { before: number; after: number } | null {
  if (!required_photos || typeof required_photos !== "object") return null;
  const r = required_photos as Record<string, unknown>;
  const before = Number(r.before ?? 0);
  const after = Number(r.after ?? 0);
  if (before <= 0 && after <= 0) return null;
  return { before, after };
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
    const beforeAfter = parseBeforeAfter(task.required_photos);

    const { data: reportRows } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("task_id", task.id);
    const reportIds = (reportRows ?? []).map((r: { id: string }) => r.id);

    let actual = 0;
    let beforeCount = 0;
    let afterCount = 0;
    let hasUnlabeledMedia = false;

    if (reportIds.length > 0) {
      const { data: rm } = await supabase
        .from("worker_report_media")
        .select("media_id, upload_session_id")
        .in("report_id", reportIds);
      const rows = (rm ?? []) as { media_id: string | null; upload_session_id: string | null }[];
      actual = new Set(rows.map((x) => x.media_id).filter(Boolean)).size;

      const sessionIds = rows.map((r) => r.upload_session_id).filter(Boolean) as string[];
      if (sessionIds.length > 0) {
        const { data: sessions } = await supabase
          .from("upload_sessions")
          .select("id, purpose")
          .in("id", sessionIds);
        for (const s of (sessions ?? []) as { id: string; purpose: string }[]) {
          if (s.purpose === "report_before") beforeCount++;
          else if (s.purpose === "report_after") afterCount++;
        }
      }
      if (rows.some((r) => r.media_id && !r.upload_session_id)) hasUnlabeledMedia = true;
    }

    if (beforeAfter && (beforeAfter.before > 0 || beforeAfter.after > 0)) {
      const beforeGap = Math.max(0, beforeAfter.before - beforeCount);
      const afterGap = Math.max(0, beforeAfter.after - afterCount);
      if (beforeGap > 0 || afterGap > 0) {
        const parts: string[] = [];
        if (beforeGap > 0) parts.push(`before: ${beforeCount}/${beforeAfter.before}`);
        if (afterGap > 0) parts.push(`after: ${afterCount}/${beforeAfter.after}`);
        signals.push({
          projectId,
          taskId: task.id,
          type: "before_after_gap",
          severity: beforeGap + afterGap > 2 ? "high" : "medium",
          required: beforeAfter.before + beforeAfter.after,
          actual: beforeCount + afterCount,
          message: `Task "${task.title}" evidence: ${parts.join("; ")}${hasUnlabeledMedia ? " (some media unlabeled)" : ""}`,
          at,
        });
      }
    } else if (actual < required) {
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
