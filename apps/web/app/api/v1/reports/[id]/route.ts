import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import * as reportRepo from "@/lib/domain/reports/report.repository";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import type { ReportReviewStatus } from "@/lib/domain/reports/report.repository";
import { emitAudit } from "@/lib/observability/audit.service";

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

  const media = await reportRepo.listMediaByReportId(supabase, id, ctx.tenantId!);
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
  if (!canReviewReport(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Tenant and user required" }, { status: 403 });
  }

  let body: { status?: string; manager_note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = typeof body.status === "string" ? body.status.trim() : undefined;
  const manager_note = body.manager_note !== undefined ? (typeof body.manager_note === "string" ? body.manager_note : null) : undefined;
  if (!status || !REVIEW_STATUSES.includes(status as ReportReviewStatus)) {
    return NextResponse.json(
      { error: "status required: one of approved, rejected, changes_requested" },
      { status: 400 }
    );
  }

  const supabase = await createClientFromRequest(request);
  const updated = await reportRepo.updateReview(supabase, id, ctx.tenantId, ctx.userId, {
    status: status as ReportReviewStatus,
    manager_note: manager_note ?? null,
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
    details: { status, has_note: !!manager_note },
  });

  const media = await reportRepo.listMediaByReportId(supabase, id, ctx.tenantId);
  return NextResponse.json({ data: { ...updated, media } });
}
