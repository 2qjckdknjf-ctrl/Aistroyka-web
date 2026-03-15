import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createReport } from "@/lib/domain/reports/report.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";
import { WorkerReportCreateRequestSchema } from "@aistroyka/contracts";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/worker/report/create";

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
  let rawBody: unknown;
  try {
    rawBody = await request.json().catch(() => ({}));
  } catch {
    rawBody = {};
  }
  const parsed = WorkerReportCreateRequestSchema.safeParse(rawBody);
  const body = parsed.success ? parsed.data : {};
  const supabase = await createClient();
  const dayId = typeof body.day_id === "string" ? body.day_id.trim() || null : null;
  const taskId = typeof body.task_id === "string" ? body.task_id.trim() || null : null;
  const result = await createReport(supabase, ctx, { dayId, taskId });
  if (result.error) {
    const status = result.code === "task_invalid" ? 404 : 403;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, { data: result.data }, 200);
  return NextResponse.json({ data: result.data });
}
