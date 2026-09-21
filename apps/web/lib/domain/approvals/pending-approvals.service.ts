import type { SupabaseClient } from "@supabase/supabase-js";

/** worker_reports has no project_id; resolve via task_id / day_id after fetch. */
export const WORKER_REPORTS_PENDING_SELECT = "id, user_id, status, submitted_at, task_id, day_id";

type ReportPendingRow = {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  task_id: string | null;
  day_id: string | null;
};

type DocumentPendingRow = {
  id: string;
  project_id: string;
  title: string;
  type: "document" | "act" | "contract";
  status: string;
  updated_at: string;
};

export type PendingApprovalItem =
  | {
      kind: "report";
      id: string;
      status: string;
      project_id: string | null;
      pending_at: string;
      worker_id: string;
    }
  | {
      kind: "document";
      id: string;
      status: string;
      project_id: string;
      pending_at: string;
      title: string;
      document_type: "document" | "act" | "contract";
    };

/**
 * Unified manager approvals queue:
 * - submitted reports
 * - under_review project documents
 * Sorted oldest pending item first.
 */
export async function listPendingApprovals(
  supabase: SupabaseClient,
  tenantId: string,
  limit: number
): Promise<PendingApprovalItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200));

  const [reportsRes, docsRes] = await Promise.all([
    supabase
      .from("worker_reports")
      .select(WORKER_REPORTS_PENDING_SELECT)
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true })
      .limit(safeLimit),
    supabase
      .from("project_documents")
      .select("id, project_id, title, type, status, updated_at")
      .eq("tenant_id", tenantId)
      .eq("status", "under_review")
      .order("updated_at", { ascending: true })
      .limit(safeLimit),
  ]);

  if (reportsRes.error) {
    throw new Error(reportsRes.error.message || "Failed to load pending reports");
  }
  if (docsRes.error) {
    throw new Error(docsRes.error.message || "Failed to load pending documents");
  }

  const reportRows = ((reportsRes.data ?? []) as ReportPendingRow[]).filter((r) =>
    Boolean(r.submitted_at)
  );

  const taskIds = Array.from(
    new Set(reportRows.map((r) => r.task_id).filter((id): id is string => Boolean(id)))
  );
  const dayIds = Array.from(
    new Set(reportRows.map((r) => r.day_id).filter((id): id is string => Boolean(id)))
  );

  const [taskRes, dayRes] = await Promise.all([
    taskIds.length > 0
      ? supabase.from("worker_tasks").select("id, project_id").eq("tenant_id", tenantId).in("id", taskIds)
      : Promise.resolve({ data: [] as { id: string; project_id: string | null }[], error: null }),
    dayIds.length > 0
      ? supabase.from("worker_day").select("id, project_id").eq("tenant_id", tenantId).in("id", dayIds)
      : Promise.resolve({ data: [] as { id: string; project_id: string | null }[], error: null }),
  ]);

  const taskProjectMap = Object.fromEntries(
    ((taskRes.data ?? []) as { id: string; project_id: string | null }[]).map((t) => [
      t.id,
      t.project_id ?? "",
    ])
  );
  const dayProjectMap = Object.fromEntries(
    ((dayRes.data ?? []) as { id: string; project_id: string | null }[]).map((d) => [
      d.id,
      d.project_id ?? "",
    ])
  );

  const reports = reportRows.map<PendingApprovalItem>((r) => {
    const fromTask = r.task_id ? taskProjectMap[r.task_id] || null : null;
    const fromDay = r.day_id ? dayProjectMap[r.day_id] || null : null;
    return {
      kind: "report",
      id: r.id,
      status: r.status,
      project_id: fromTask ?? fromDay,
      pending_at: r.submitted_at ?? new Date().toISOString(),
      worker_id: r.user_id,
    };
  });

  const documents = ((docsRes.data ?? []) as DocumentPendingRow[]).map<PendingApprovalItem>((d) => ({
    kind: "document",
    id: d.id,
    status: d.status,
    project_id: d.project_id,
    pending_at: d.updated_at,
    title: d.title,
    document_type: d.type,
  }));

  return [...reports, ...documents]
    .sort((a, b) => a.pending_at.localeCompare(b.pending_at))
    .slice(0, safeLimit);
}
