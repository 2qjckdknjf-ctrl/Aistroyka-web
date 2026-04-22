import type { SupabaseClient } from "@supabase/supabase-js";

type ReportPendingRow = {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  project_id: string | null;
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
      .select("id, user_id, status, submitted_at, project_id")
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

  const reports = ((reportsRes.data ?? []) as ReportPendingRow[])
    .filter((r) => Boolean(r.submitted_at))
    .map<PendingApprovalItem>((r) => ({
      kind: "report",
      id: r.id,
      status: r.status,
      project_id: r.project_id,
      pending_at: r.submitted_at ?? new Date().toISOString(),
      worker_id: r.user_id,
    }));

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
