/**
 * Server-side report completeness evaluator.
 * Clients cannot self-declare a report complete.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import * as reportRepo from "./report.repository";

export const COMPLETENESS_RULES_VERSION = "pilot-v1";

export type ReportCompletenessStatus = "complete" | "incomplete" | "needs_manager_review";

export interface ReportCompletenessResult {
  report_id: string;
  status: ReportCompletenessStatus;
  reasons: string[];
  missing_fields: string[];
  rules_version: string;
  evaluated_at: string;
  has_before: boolean;
  has_after: boolean;
  before_after_pair_valid: boolean;
  media_reference_valid: boolean;
}

function parseBeforeAfter(required_photos: unknown): { before: number; after: number } | null {
  if (!required_photos || typeof required_photos !== "object") return null;
  const r = required_photos as Record<string, unknown>;
  const before = Number(r.before ?? 0);
  const after = Number(r.after ?? 0);
  if (before <= 0 && after <= 0) return null;
  return { before, after };
}

export async function evaluateReportCompleteness(
  supabase: SupabaseClient,
  tenantId: string,
  reportId: string
): Promise<ReportCompletenessResult> {
  const evaluatedAt = new Date().toISOString();
  const reasons: string[] = [];
  const missingFields: string[] = [];

  const report = await reportRepo.getById(supabase, reportId, tenantId);
  if (!report) {
    return {
      report_id: reportId,
      status: "incomplete",
      reasons: ["report_not_found"],
      missing_fields: ["report"],
      rules_version: COMPLETENESS_RULES_VERSION,
      evaluated_at: evaluatedAt,
      has_before: false,
      has_after: false,
      before_after_pair_valid: false,
      media_reference_valid: false,
    };
  }

  const projectId = await reportRepo.getProjectIdForReport(supabase, tenantId, report);
  if (!projectId) {
    reasons.push("project_link_missing");
    missingFields.push("project_id");
  }

  const mediaRows = await reportRepo.listMediaByReportId(supabase, reportId, tenantId);
  const sessionIds = mediaRows.map((r) => r.upload_session_id).filter(Boolean) as string[];
  const mediaIds = mediaRows.map((r) => r.media_id).filter(Boolean);

  let beforeCount = 0;
  let afterCount = 0;
  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("upload_sessions")
      .select("id, purpose, status")
      .in("id", sessionIds);
    for (const s of (sessions ?? []) as { purpose: string; status: string }[]) {
      if (s.purpose === "report_before") beforeCount++;
      if (s.purpose === "report_after") afterCount++;
    }
  }

  const hasBefore = beforeCount > 0;
  const hasAfter = afterCount > 0;
  const mediaReferenceValid = mediaRows.some((r) => Boolean(r.media_id || r.upload_session_id));

  if (!mediaReferenceValid) {
    reasons.push("media_missing");
    missingFields.push("media");
  }

  let beforeAfterRequired = false;
  let beforeAfterPairValid = true;
  if (report.task_id) {
    const { data: task } = await supabase
      .from("worker_tasks")
      .select("required_photos, title")
      .eq("id", report.task_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    const ba = parseBeforeAfter((task as { required_photos?: unknown } | null)?.required_photos);
    if (ba) {
      beforeAfterRequired = true;
      if (ba.before > 0 && beforeCount < ba.before) {
        reasons.push("before_photos_missing");
        missingFields.push("before_photos");
        beforeAfterPairValid = false;
      }
      if (ba.after > 0 && afterCount < ba.after) {
        reasons.push("after_photos_missing");
        missingFields.push("after_photos");
        beforeAfterPairValid = false;
      }
    }
  } else if (beforeCount === 0 && afterCount === 0 && mediaIds.length === 0 && sessionIds.length === 0) {
    reasons.push("before_after_unlabeled");
    missingFields.push("before_or_after_photos");
    beforeAfterPairValid = false;
  }

  if (!report.worker_note || report.worker_note.trim().length === 0) {
    reasons.push("worker_note_missing");
    missingFields.push("worker_note");
  }

  if (report.status === "submitted" && !report.reviewed_at) {
    // Submitted but not manager-reviewed — may need manager review if critical signals present
    if (reasons.includes("before_photos_missing") || reasons.includes("after_photos_missing")) {
      // flagged below
    }
  }

  let status: ReportCompletenessStatus = "complete";
  if (reasons.length > 0) {
    status = "incomplete";
  }
  if (
    report.status === "submitted" &&
    (reasons.includes("before_photos_missing") ||
      reasons.includes("after_photos_missing") ||
      reasons.includes("before_after_unlabeled"))
  ) {
    status = "needs_manager_review";
  }

  const result: ReportCompletenessResult = {
    report_id: reportId,
    status,
    reasons,
    missing_fields: missingFields,
    rules_version: COMPLETENESS_RULES_VERSION,
    evaluated_at: evaluatedAt,
    has_before: hasBefore,
    has_after: hasAfter,
    before_after_pair_valid: beforeAfterRequired ? beforeAfterPairValid : hasBefore || hasAfter || mediaReferenceValid,
    media_reference_valid: mediaReferenceValid,
  };

  await supabase.from("report_completeness_evaluations").upsert(
    {
      tenant_id: tenantId,
      report_id: reportId,
      status: result.status,
      reasons: result.reasons,
      missing_fields: result.missing_fields,
      rules_version: result.rules_version,
      evaluated_at: result.evaluated_at,
    },
    { onConflict: "tenant_id,report_id" }
  );

  return result;
}
