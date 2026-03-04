import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { enqueueJob } from "@/lib/platform/jobs/job.service";
import { emitAudit } from "@/lib/observability/audit.service";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/exports
 * Body: { export_type: "reports" | "ai_usage" | "audit_logs", range_days?: number }
 * Starts async export job; returns job id for status polling. Rate-limited and audited.
 */
export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "admin:read")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const admin = getAdminClient();
  if (admin) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
    const result = await checkRateLimit(admin, { tenantId: ctx.tenantId, ip, endpoint: "/api/v1/admin/exports" });
    if (result.limited) return NextResponse.json({ error: result.message }, { status: 429 });
  }
  let body: { export_type?: string; range_days?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const exportType = body?.export_type ?? "audit_logs";
  const validTypes = ["reports", "ai_usage", "audit_logs"];
  if (!validTypes.includes(exportType)) {
    return NextResponse.json({ error: "Invalid export_type" }, { status: 400 });
  }
  const rangeDays = Math.min(Math.max(Number(body?.range_days) || 30, 1), 365);
  const supabase = await createClient();
  const job = await enqueueJob(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    type: "export",
    payload: { export_type: exportType, range_days: rangeDays },
    trace_id: ctx.traceId,
    max_attempts: 3,
  });
  if (!job) {
    return NextResponse.json({ error: "Failed to enqueue export" }, { status: 500 });
  }
  await emitAudit(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    trace_id: ctx.traceId,
    action: "export",
    resource_type: "export_job",
    resource_id: job.id,
    details: { export_type: exportType, range_days: rangeDays },
  });
  return NextResponse.json({ data: { job_id: job.id, status: job.status } });
}
