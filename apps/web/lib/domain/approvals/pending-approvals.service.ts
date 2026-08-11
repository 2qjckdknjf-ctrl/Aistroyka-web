import type { SupabaseClient } from "@supabase/supabase-js";
import { listReportsByStatusesForManager } from "@/lib/domain/reports/report-list.repository";

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
      queue: "approval" | "follow_up";
      reason?: string | null;
    }
  | {
      kind: "document";
      id: string;
      status: string;
      project_id: string;
      pending_at: string;
      title: string;
      document_type: "document" | "act" | "contract";
      queue: "approval" | "follow_up";
      reason?: string | null;
    };

/**
 * Unified manager approvals / follow-up queue:
 * - submitted reports (approval)
 * - under_review documents (approval)
 * - changes_requested reports/documents (follow-up)
 * Sorted oldest pending item first.
 */
export async function listPendingApprovals(
  supabase: SupabaseClient,
  tenantId: string,
  limit: number
): Promise<PendingApprovalItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200));

  const [submittedReports, changesRequestedReports, docsRes] = await Promise.all([
    listReportsByStatusesForManager(supabase, tenantId, ["submitted"], {
      limit: safeLimit,
      orderColumn: "submitted_at",
    }),
    listReportsByStatusesForManager(supabase, tenantId, ["changes_requested"], {
      limit: safeLimit,
      orderColumn: "reviewed_at",
    }),
    supabase
      .from("project_documents")
      .select("id, project_id, title, type, status, updated_at")
      .eq("tenant_id", tenantId)
      .in("status", ["under_review", "changes_requested"])
      .order("updated_at", { ascending: true })
      .limit(safeLimit),
  ]);

  const reports: PendingApprovalItem[] = [
    ...submittedReports
      .filter((r) => Boolean(r.submitted_at))
      .map<PendingApprovalItem>((r) => ({
        kind: "report",
        id: r.id,
        status: r.status,
        project_id: r.project_id,
        pending_at: r.submitted_at ?? new Date().toISOString(),
        worker_id: r.user_id,
        queue: "approval",
        reason: "Awaiting manager review",
      })),
    ...changesRequestedReports.map<PendingApprovalItem>((r) => ({
      kind: "report",
      id: r.id,
      status: r.status,
      project_id: r.project_id,
      pending_at: r.reviewed_at ?? r.submitted_at ?? r.created_at,
      worker_id: r.user_id,
      queue: "follow_up",
      reason: r.manager_note ?? "Worker resubmit pending",
    })),
  ];

  const documents = ((docsRes.data ?? []) as DocumentPendingRow[]).map<PendingApprovalItem>((d) => ({
    kind: "document",
    id: d.id,
    status: d.status,
    project_id: d.project_id,
    pending_at: d.updated_at,
    title: d.title,
    document_type: d.type,
    queue: d.status === "under_review" ? "approval" : "follow_up",
    reason:
      d.status === "under_review"
        ? "Awaiting document review"
        : "Document resubmission pending",
  }));

  return [...reports, ...documents]
    .sort((a, b) => a.pending_at.localeCompare(b.pending_at))
    .slice(0, safeLimit);
}
