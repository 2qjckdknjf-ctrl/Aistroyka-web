import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import * as reportRepo from "@/lib/domain/reports/report.repository";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import type { ReportReviewStatus } from "@/lib/domain/reports/report.repository";
import { emitAudit } from "@/lib/observability/audit.service";
import { getProjectMembership } from "@/lib/domain/projects/project-access";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { applyOwnerVisibilityOnReportReview } from "@/lib/domain/visual-evidence/owner-evidence-visibility.service";

export const dynamic = "force-dynamic";

const REVIEW_STATUSES: ReportReviewStatus[] = ["approved", "rejected", "changes_requested"];

/** GET /api/v1/reports/:id — report detail with media (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const report = await reportRepo.getById(supabase, id, ctx.tenantId!);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Lite field workers: only own report (peer isolation). Dashboard / manager clients keep tenant-wide read for reviewers.
  if (isLiteWorkerClient(ctx)) {
    if (report.user_id !== ctx.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else if (!canReviewReport(ctx) && report.user_id !== ctx.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const media = await reportRepo.listMediaByReportIdWithUrls(supabase, id, ctx.tenantId!);
  return NextResponse.json({ data: { ...report, media } });
}

/** PATCH /api/v1/reports/:id — manager review (approve / reject / changes_requested). Tenant-scoped, role-restricted. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Tenant and user required" }, { status: 403 });
  }
  if (isLiteWorkerClient(ctx) || !canReviewReport(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: { status?: string; manager_note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = typeof body.status === "string" ? body.status.trim() : undefined;
  const rawNote = body.manager_note;
  const normalizedNote =
    rawNote === undefined ? null : typeof rawNote === "string" ? rawNote.trim() || null : null;
  if (!status || !REVIEW_STATUSES.includes(status as ReportReviewStatus)) {
    return NextResponse.json(
      { error: "status required: one of approved, rejected, changes_requested" },
      { status: 400 }
    );
  }

  if ((status === "rejected" || status === "changes_requested") && !normalizedNote) {
    return NextResponse.json(
      {
        error: "Manager note is required when rejecting or requesting changes",
        code: "manager_note_required",
      },
      { status: 400 }
    );
  }

  const supabase = await createClientFromRequest(request);
  const report = await reportRepo.getById(supabase, id, ctx.tenantId);
  if (!report) {
    return NextResponse.json(
      { error: "Report not found or not in submitted status" },
      { status: 404 }
    );
  }
  const canReview = await canReviewReportInRoute(supabase, ctx, report);
  if (!canReview) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const updated = await reportRepo.updateReview(supabase, id, ctx.tenantId, ctx.userId, {
    status: status as ReportReviewStatus,
    manager_note: normalizedNote,
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Report not found or not in submitted status" },
      { status: 404 }
    );
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    trace_id: ctx.traceId ?? null,
    action: "report_review",
    resource_type: "report",
    resource_id: id,
    details: { status, has_note: Boolean(normalizedNote) },
  });

  const projectId = await reportRepo.getProjectIdForReport(supabase, ctx.tenantId, updated);
  if (projectId) {
    await applyOwnerVisibilityOnReportReview(supabase, {
      tenantId: ctx.tenantId,
      reportId: id,
      projectId,
      reviewerId: ctx.userId,
      reviewStatus: status as ReportReviewStatus,
      traceId: ctx.traceId ?? null,
    });
  }

  const media = await reportRepo.listMediaByReportIdWithUrls(supabase, id, ctx.tenantId);
  return NextResponse.json({ data: { ...updated, media } });
}

async function canReviewReportInRoute(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  ctx: TenantContext,
  report: { task_id?: string | null; day_id?: string | null }
): Promise<boolean> {
  if (isLiteWorkerClient(ctx)) return false;
  if (ctx.role === "owner" || ctx.role === "admin") return true;
  if (!canReviewReport(ctx)) return false;
  const projectId = await reportRepo.getProjectIdForReport(supabase, ctx.tenantId, report);
  if (!projectId) return false;
  const membership = await getProjectMembership(supabase, ctx.tenantId, projectId, ctx.userId);
  return membership?.role === "manager";
}
