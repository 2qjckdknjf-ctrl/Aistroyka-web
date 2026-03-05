import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { addMediaToReport } from "@/lib/domain/reports/report.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/worker/report/add-media";

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
  let body: { report_id: string; media_id?: string; upload_session_id?: string } = { report_id: "" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reportId = typeof body.report_id === "string" ? body.report_id.trim() : "";
  if (!reportId) return NextResponse.json({ error: "report_id required" }, { status: 400 });
  if (!body.media_id && !body.upload_session_id) {
    return NextResponse.json({ error: "media_id or upload_session_id required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { ok, error } = await addMediaToReport(supabase, ctx, reportId, {
    mediaId: body.media_id,
    uploadSessionId: body.upload_session_id,
  });
  if (!ok) return NextResponse.json({ error }, { status: 403 });
  const response = { ok: true };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return NextResponse.json(response);
}
