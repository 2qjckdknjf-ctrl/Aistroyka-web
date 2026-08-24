/**
 * Owner evidence visibility lifecycle — server-side only.
 * Clients cannot set owner_visible directly.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportReviewStatus } from "@/lib/domain/reports/report.repository";
import * as reportRepo from "@/lib/domain/reports/report.repository";
import { emitAudit } from "@/lib/observability/audit.service";

export type VisibilityTransitionResult = {
  updated_count: number;
  report_id: string;
  review_status: ReportReviewStatus;
  idempotent: boolean;
};

const ACTIVE_RETENTION = "active";

function isEligibleForOwnerVisibility(row: {
  internal_only: boolean;
  retention_state: string;
  project_id: string;
}): boolean {
  return !row.internal_only && row.retention_state === ACTIVE_RETENTION;
}

/**
 * Apply owner visibility when a manager reviews a report.
 * Idempotent: repeated approval does not duplicate audit side effects meaningfully.
 */
export async function applyOwnerVisibilityOnReportReview(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    reportId: string;
    projectId: string;
    reviewerId: string;
    reviewStatus: ReportReviewStatus;
    traceId?: string | null;
  }
): Promise<VisibilityTransitionResult> {
  const { tenantId, reportId, projectId, reviewerId, reviewStatus } = params;

  const report = await reportRepo.getById(supabase, reportId, tenantId);
  if (!report) {
    return { updated_count: 0, report_id: reportId, review_status: reviewStatus, idempotent: true };
  }

  const resolvedProjectId = await reportRepo.getProjectIdForReport(supabase, tenantId, report);
  if (!resolvedProjectId || resolvedProjectId !== projectId) {
    return { updated_count: 0, report_id: reportId, review_status: reviewStatus, idempotent: true };
  }

  const { data: rows } = await supabase
    .from("visual_evidence_records")
    .select("id, owner_visible, manager_verified, internal_only, retention_state, project_id")
    .eq("tenant_id", tenantId)
    .eq("report_id", reportId)
    .eq("project_id", projectId);

  const evidence = (rows ?? []) as Array<{
    id: string;
    owner_visible: boolean;
    manager_verified: boolean;
    internal_only: boolean;
    retention_state: string;
    project_id: string;
  }>;

  if (evidence.length === 0) {
    return { updated_count: 0, report_id: reportId, review_status: reviewStatus, idempotent: true };
  }

  let targetVisible = false;
  let targetVerified = false;

  if (reviewStatus === "approved") {
    targetVisible = true;
    targetVerified = true;
  } else {
    targetVisible = false;
    targetVerified = false;
  }

  const idsToShow: string[] = [];
  const idsToHide: string[] = [];

  for (const row of evidence) {
    if (reviewStatus === "approved") {
      if (!isEligibleForOwnerVisibility(row)) continue;
      if (!row.owner_visible || !row.manager_verified) idsToShow.push(row.id);
    } else if (!row.owner_visible && !row.manager_verified) {
      continue;
    } else {
      idsToHide.push(row.id);
    }
  }

  let updatedCount = 0;

  if (reviewStatus === "approved" && idsToShow.length > 0) {
    const { data: updated, error } = await supabase
      .from("visual_evidence_records")
      .update({
        owner_visible: targetVisible,
        manager_verified: targetVerified,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .in("id", idsToShow)
      .eq("internal_only", false)
      .eq("retention_state", ACTIVE_RETENTION)
      .select("id");
    if (!error) updatedCount += (updated ?? []).length;
  }

  if (reviewStatus !== "approved" && idsToHide.length > 0) {
    const { data: updated, error } = await supabase
      .from("visual_evidence_records")
      .update({
        owner_visible: false,
        manager_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .in("id", idsToHide)
      .select("id");
    if (!error) updatedCount += (updated ?? []).length;
  }

  const idempotent = updatedCount === 0;

  if (updatedCount > 0) {
    await emitAudit(supabase, {
      tenant_id: tenantId,
      user_id: reviewerId,
      trace_id: params.traceId ?? null,
      action: "evidence_owner_visibility",
      resource_type: "report",
      resource_id: reportId,
      details: {
        review_status: reviewStatus,
        updated_count: updatedCount,
        project_id: projectId,
        owner_visible: targetVisible,
      },
    });
  }

  return {
    updated_count: updatedCount,
    report_id: reportId,
    review_status: reviewStatus,
    idempotent,
  };
}
