/**
 * Evidence staleness detection: identifies stale evidence relative to project activity.
 * Uses transparent thresholds: no recent evidence when project has recent activity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceSignal } from "../domain";

const STALE_DAYS = 14;
const ACTIVITY_DAYS = 7;
const ID_CHUNK_SIZE = 100;

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

  const [mediaRes, taskRes, dayRes] = await Promise.all([
    supabase
      .from("media")
      .select("id, uploaded_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("uploaded_at", { ascending: false })
      .limit(1),
    supabase
      .from("worker_tasks")
      .select("id, due_date, updated_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "in_progress"]),
    supabase
      .from("worker_day")
      .select("id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
  ]);

  if (mediaRes.error) throw new Error("evidence_staleness_media_query_failed");
  if (taskRes.error) throw new Error("evidence_staleness_tasks_query_failed");
  if (dayRes.error) throw new Error("evidence_staleness_days_query_failed");

  const latestMedia = (mediaRes.data ?? [])[0] as { uploaded_at: string } | undefined;
  const activeTasks = (taskRes.data ?? []) as Array<{ id: string; due_date: string | null; updated_at: string }>;
  const dayIds = ((dayRes.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  const taskIds = activeTasks.map((row) => row.id);
  const latestReportAt = await getLatestSubmittedProjectReportAt(supabase, tenantId, taskIds, dayIds);

  const hasActiveTasks = activeTasks.length > 0;
  const hasRecentTaskActivity = activeTasks.some((t) => {
    const up = t.updated_at?.slice(0, 10);
    return Boolean(up && up >= activityIso);
  });
  const hasRecentReport = Boolean(latestReportAt && latestReportAt.slice(0, 10) >= activityIso);
  const hasRecentEvidence = Boolean(latestMedia && latestMedia.uploaded_at?.slice(0, 10) >= staleIso);

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

async function getLatestSubmittedProjectReportAt(
  supabase: SupabaseClient,
  tenantId: string,
  taskIds: string[],
  dayIds: string[]
): Promise<string | null> {
  let latest: string | null = null;

  for (const ids of chunk(taskIds, ID_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("worker_reports")
      .select("submitted_at")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .not("submitted_at", "is", null)
      .in("task_id", ids)
      .order("submitted_at", { ascending: false })
      .limit(1);
    if (error) throw new Error("evidence_staleness_task_reports_query_failed");
    latest = newerIso(latest, (data?.[0] as { submitted_at?: string | null } | undefined)?.submitted_at ?? null);
  }

  for (const ids of chunk(dayIds, ID_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("worker_reports")
      .select("submitted_at")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .not("submitted_at", "is", null)
      .in("day_id", ids)
      .order("submitted_at", { ascending: false })
      .limit(1);
    if (error) throw new Error("evidence_staleness_day_reports_query_failed");
    latest = newerIso(latest, (data?.[0] as { submitted_at?: string | null } | undefined)?.submitted_at ?? null);
  }

  return latest;
}

function newerIso(current: string | null, candidate: string | null): string | null {
  if (!candidate) return current;
  if (!current) return candidate;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
