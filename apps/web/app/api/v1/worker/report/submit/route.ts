import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { submitReport } from "@/lib/domain/reports/report.service";
import {
  IDEMPOTENCY_HEADER,
  getCachedResponse,
  storeResponse,
} from "@/lib/platform/idempotency/idempotency.service";

export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/worker/report/submit";

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
  const supabase = await createClient();
  const idemKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (idemKey && ctx.tenantId && ctx.userId) {
    const cached = await getCachedResponse(supabase, idemKey, ctx.tenantId, ctx.userId, ROUTE);
    if (cached) return NextResponse.json(cached.response, { status: cached.statusCode });
  }
  let body: { report_id: string } = { report_id: "" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reportId = typeof body.report_id === "string" ? body.report_id.trim() : "";
  if (!reportId) return NextResponse.json({ error: "report_id required" }, { status: 400 });
  const { ok, error, jobIds } = await submitReport(supabase, ctx, reportId, ctx.traceId);
  if (!ok) return NextResponse.json({ error }, { status: 403 });
  const response = { reportId, jobIds: jobIds ?? [], status: "queued" };
  if (idemKey && ctx.tenantId && ctx.userId) {
    await storeResponse(supabase, idemKey, ctx.tenantId, ctx.userId, ROUTE, response, 200);
  }
  return NextResponse.json(response);
}
