/**
 * Helpers for GET /api/v1/worker/sync report payload construction.
 * Keeps actionable manager feedback (changes_requested) from being crowded out
 * by a newest-created top-N window.
 */

export type WorkerSyncReportRow = {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
};

/**
 * Prefer feedback rows, then fill with recent rows; dedupe by id; cap at limit.
 */
export function mergeWorkerSyncReports(
  feedback: WorkerSyncReportRow[],
  recent: WorkerSyncReportRow[],
  limit = 50
): WorkerSyncReportRow[] {
  const out: WorkerSyncReportRow[] = [];
  const seen = new Set<string>();
  for (const row of feedback) {
    if (out.length >= limit) break;
    if (seen.has(row.id)) continue;
    out.push(row);
    seen.add(row.id);
  }
  for (const row of recent) {
    if (out.length >= limit) break;
    if (seen.has(row.id)) continue;
    out.push(row);
    seen.add(row.id);
  }
  return out;
}

/**
 * Optional since-filter for deltas. Never drop changes_requested — that status
 * can change long after created_at/submitted_at, and workers must still see it.
 */
export function filterWorkerSyncReportsDelta(
  reports: WorkerSyncReportRow[],
  since: string | null
): WorkerSyncReportRow[] {
  if (!since) return reports;
  return reports.filter(
    (r) =>
      r.status === "changes_requested" ||
      r.created_at >= since ||
      (r.submitted_at != null && r.submitted_at >= since)
  );
}
