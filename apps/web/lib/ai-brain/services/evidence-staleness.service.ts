/**
 * Evidence staleness detection: identifies stale evidence relative to project activity.
 * Uses transparent thresholds: no recent evidence when project has recent activity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceSignal } from "../domain";

const STALE_DAYS = 14;
const ACTIVITY_DAYS = 7;

export async function getStalenessSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<EvidenceSignal[]> {
  const at = new Date().toISOString();
  const signals: EvidenceSignal[] = [];

  const staleSince = new Date();
  staleSince.setDate(staleSince.getDate() - STALE_DAYS);
  const staleIso = staleSince.toISOString().slice(0, 10);

  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - ACTIVITY_DAYS);
  const activityIso = activitySince.toISOString().slice(0, 10);

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: mediaRows },
    { data: reportRows },
    { data: taskRows },
  ] = await Promise.all([
    supabase
      .from("media")
      .select("id, uploaded_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("uploaded_at", { ascending: false })
      .limit(1),
    supabase
      .from("worker_reports")
      .select("id, submitted_at")
      .eq("tenant_id", tenantId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1),
    supabase
      .from("worker_tasks")
      .select("id, due_date, updated_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "in_progress"]),
  ]);

  const latestMedia = (mediaRows ?? [])[0] as { uploaded_at: string } | undefined;
  const latestReport = (reportRows ?? [])[0] as { submitted_at: string } | undefined;
  const activeTasks = (taskRows ?? []) as { due_date: string | null; updated_at: string }[];

  const hasActiveTasks = activeTasks.length > 0;
  const hasRecentTaskActivity = activeTasks.some((t) => {
    const up = t.updated_at?.slice(0, 10);
    return up && up >= activityIso;
  });
  const hasRecentReport = latestReport && latestReport.submitted_at?.slice(0, 10) >= activityIso;
  const hasRecentEvidence = latestMedia && latestMedia.uploaded_at?.slice(0, 10) >= staleIso;

  if (!hasActiveTasks) return signals;

  const hasRecentActivity = hasRecentTaskActivity || hasRecentReport;
  if (!hasRecentActivity) return signals;

  if (!hasRecentEvidence) {
    const lastEvidence = latestMedia?.uploaded_at?.slice(0, 10) ?? "never";
    signals.push({
      projectId,
      type: "stale",
      severity: "medium",
      message: `No evidence in last ${STALE_DAYS} days (last: ${lastEvidence}) while project has recent activity`,
      at,
    });
  }

  return signals;
}
