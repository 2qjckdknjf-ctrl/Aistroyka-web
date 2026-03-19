/**
 * GET /api/v1/reports/:id/approval-history — audit trail for this report (submit + review events).
 * Tenant-scoped; caller must have access to the report (manager or report owner).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import * as reportRepo from "@/lib/domain/reports/report.repository";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { listAuditLogsForResource } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

const REPORT_ACTIONS = ["report_submit", "report_review"];

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

  const isManager = canReviewReport(ctx);
  const isOwner = report.user_id === ctx.userId;
  if (!isManager && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listAuditLogsForResource(supabase, ctx.tenantId!, "report", id, 50);
  const events = rows
    .filter((r) => REPORT_ACTIONS.includes(r.action))
    .map((r) => ({
      action: r.action,
      user_id: r.user_id,
      created_at: r.created_at,
      details: r.details ?? {},
    }));

  return NextResponse.json({ data: { report_id: id, events } });
}
