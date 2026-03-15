import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { addMediaToReport } from "@/lib/domain/reports/report.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";
import { WorkerReportAddMediaRequestSchema } from "@aistroyka/contracts";

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
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = WorkerReportAddMediaRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { report_id: reportId, media_id: mediaId, upload_session_id: uploadSessionId } = parsed.data;
  const supabase = await createClient();
  const { ok, error } = await addMediaToReport(supabase, ctx, reportId, {
    mediaId,
    uploadSessionId,
  });
  if (!ok) return NextResponse.json({ error }, { status: 403 });
  const response = { ok: true };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return NextResponse.json(response);
}
