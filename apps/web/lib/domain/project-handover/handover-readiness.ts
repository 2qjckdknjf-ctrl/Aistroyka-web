/**
 * Wave 4 Step 12 — explicit, explainable readiness rules (computed; not a generic rules engine).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import * as defectRepo from "@/lib/domain/defects/defects.repository";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import type { ProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import type { HandoverBlocker, HandoverReadinessResult } from "./project-handover.types";

const BLOCKING_CHANGE_ORDER_STATUSES = ["draft", "proposed", "under_review", "approved"] as const;

const BLOCKING_DOCUMENT_STATUSES = ["draft", "uploaded", "under_review", "rejected", "changes_requested"] as const;

const OPEN_DISCUSSION_STATUSES = ["open", "awaiting_stakeholder", "awaiting_manager"] as const;

/**
 * Same as {@link computeHandoverReadiness} but uses a pre-fetched summary (avoids duplicate aggregate queries).
 */
export async function computeHandoverReadinessFromSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  summary: ProjectSummary
): Promise<HandoverReadinessResult> {
  const base = `/dashboard/projects/${projectId}`;
  const blockers: HandoverBlocker[] = [];

  if (summary.overdueMilestonesCount > 0) {
    blockers.push({
      code: "overdue_milestones",
      severity: "blocking",
      title: "Overdue milestones",
      detail: "Active milestones are past their target date.",
      count: summary.overdueMilestonesCount,
      href: `${base}?tab=schedule`,
    });
  }

  if (summary.openIssuesCount > 0) {
    blockers.push({
      code: "open_issues",
      severity: "blocking",
      title: "Open issues",
      detail: "Project issues are not closed.",
      count: summary.openIssuesCount,
      href: `${base}?tab=issues`,
    });
  }

  if (summary.pendingReportApprovalsCount > 0) {
    blockers.push({
      code: "pending_report_approvals",
      severity: "blocking",
      title: "Reports awaiting review",
      detail: "Submitted field reports need manager review.",
      count: summary.pendingReportApprovalsCount,
      href: "/dashboard/approvals",
    });
  }

  const [
    { count: docBlockCount },
    { count: coBlockCount },
    { count: discCount },
    { count: reqCount },
  ] = await Promise.all([
    supabase
      .from("project_documents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", [...BLOCKING_DOCUMENT_STATUSES]),
    supabase
      .from("project_change_orders")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", [...BLOCKING_CHANGE_ORDER_STATUSES]),
    supabase
      .from("project_stakeholder_discussions")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", [...OPEN_DISCUSSION_STATUSES]),
    supabase
      .from("project_client_requests")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .eq("action_mode", "action_required"),
  ]);

  const nDoc = docBlockCount ?? 0;
  if (nDoc > 0) {
    blockers.push({
      code: "documents_not_final",
      severity: "blocking",
      title: "Documents not finalized",
      detail: "Some documents are not approved or archived.",
      count: nDoc,
      href: `${base}?tab=documents`,
    });
  }

  const nCo = coBlockCount ?? 0;
  if (nCo > 0) {
    blockers.push({
      code: "open_change_orders",
      severity: "blocking",
      title: "Open change orders",
      detail: "Change orders are still open or not implemented.",
      count: nCo,
      href: base,
    });
  }

  const nDisc = discCount ?? 0;
  if (nDisc > 0) {
    blockers.push({
      code: "open_discussions",
      severity: "blocking",
      title: "Open stakeholder discussions",
      detail: "Structured discussions are still active.",
      count: nDisc,
      href: `${base}/client/discussions`,
    });
  }

  const nReq = reqCount ?? 0;
  if (nReq > 0) {
    blockers.push({
      code: "pending_client_requests",
      severity: "blocking",
      title: "Pending client requests",
      detail: "The client still has open requests that require action.",
      count: nReq,
      href: `${base}/client`,
    });
  }

  const blockingDefects = await defectRepo.countBlockingOpen(supabase, projectId, tenantId);
  if (blockingDefects > 0) {
    blockers.push({
      code: "blocking_punch_defects",
      severity: "blocking",
      title: "Blocking punch list items",
      detail: "Open defects marked as blocking handover must be cleared or reclassified.",
      count: blockingDefects,
      href: `${base}?tab=defects`,
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}

/**
 * Compute blockers for project-level handover. All checks are tenant/project scoped via RLS.
 */
export async function computeHandoverReadiness(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<HandoverReadinessResult> {
  const summary = await getProjectSummary(supabase, projectId, tenantId);
  return computeHandoverReadinessFromSummary(supabase, projectId, tenantId, summary);
}
