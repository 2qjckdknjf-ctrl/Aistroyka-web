import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { submitReport } from "@/lib/domain/reports/report.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/worker/report/submit";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return guard.response;
  let body: { report_id: string; task_id?: string } = { report_id: "" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reportId = typeof body.report_id === "string" ? body.report_id.trim() : "";
  if (!reportId) return NextResponse.json({ error: "report_id required" }, { status: 400 });
  const taskId = typeof body.task_id === "string" ? body.task_id.trim() || undefined : undefined;
  const supabase = await createClient();
  const result = await submitReport(supabase, ctx, reportId, ctx.traceId, { taskId });
  if (!result.ok) {
    const status = result.code === "task_invalid" ? 404 : 403;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }
  const { jobIds } = result;
  const response = { reportId, jobIds: jobIds ?? [], status: "queued" };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return NextResponse.json(response);
}
