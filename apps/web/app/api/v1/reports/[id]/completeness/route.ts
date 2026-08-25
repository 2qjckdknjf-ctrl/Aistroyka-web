/**
 * GET /api/v1/reports/:id/completeness — server-computed report completeness.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import * as reportRepo from "@/lib/domain/reports/report.repository";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import { evaluateReportCompleteness } from "@/lib/domain/reports/report-completeness.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const report = await reportRepo.getById(supabase, id, ctx.tenantId!);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isLiteWorkerClient(ctx)) {
    if (report.user_id !== ctx.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else if (!canReviewReport(ctx) && report.user_id !== ctx.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const evaluation = await evaluateReportCompleteness(supabase, ctx.tenantId!, id);
  return NextResponse.json({ data: evaluation });
}
