/**
 * worker_reports has no project_id. Canonical attribution:
 * day project first, then task fallback. Empty strings are missing.
 */
export function resolveWorkerReportProjectId(
  fromDay: string | null | undefined,
  fromTask: string | null | undefined
): string | null {
  const day = typeof fromDay === "string" && fromDay.length > 0 ? fromDay : null;
  const task = typeof fromTask === "string" && fromTask.length > 0 ? fromTask : null;
  return day ?? task;
}
