import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { submitReport } from "@/lib/domain/reports/report.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";
import { withRequestIdAndTiming } from "@/lib/observability";
import { WorkerReportSubmitRequestSchema } from "@aistroyka/contracts";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/worker/report/submit";

export async function POST(request: Request) {
  const start = Date.now();
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(
        request,
        NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 }),
        { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start }
      );
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) {
    return withRequestIdAndTiming(request, guard.response, {
      route: ROUTE_KEY,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Invalid JSON" }, { status: 400 }), {
      route: ROUTE_KEY,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }
  const parsed = WorkerReportSubmitRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? parsed.error.flatten().fieldErrors.report_id?.[0] ?? "Invalid request body";
    return withRequestIdAndTiming(request, NextResponse.json({ error: msg }, { status: 400 }), {
      route: ROUTE_KEY,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }
  const { report_id: reportId, task_id: taskId } = parsed.data;
  const supabase = await createClientFromRequest(request);
  const result = await submitReport(supabase, ctx, reportId, ctx.traceId, { taskId: taskId?.trim() || undefined });
  if (!result.ok) {
    const status = result.code === "task_invalid" ? 404 : 403;
    return withRequestIdAndTiming(
      request,
      NextResponse.json({ error: result.error, code: result.code }, { status }),
      { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId }
    );
  }
  const { jobIds } = result;
  const response = { reportId, jobIds: jobIds ?? [], status: "queued" };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return withRequestIdAndTiming(request, NextResponse.json(response), {
    route: ROUTE_KEY,
    method: "POST",
    duration_ms: Date.now() - start,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
  });
}
