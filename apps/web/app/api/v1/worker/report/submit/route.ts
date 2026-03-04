import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { submitReport } from "@/lib/domain/reports/report.service";

export const dynamic = "force-dynamic";

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
  let body: { report_id: string } = { report_id: "" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reportId = typeof body.report_id === "string" ? body.report_id.trim() : "";
  if (!reportId) return NextResponse.json({ error: "report_id required" }, { status: 400 });
  const supabase = await createClient();
  const { ok, error } = await submitReport(supabase, ctx, reportId);
  if (!ok) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
