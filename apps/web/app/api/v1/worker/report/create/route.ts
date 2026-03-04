import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createReport } from "@/lib/domain/reports/report.service";

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
  let body: { day_id?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    /* empty body ok */
  }
  const supabase = await createClient();
  const dayId = typeof body.day_id === "string" ? body.day_id.trim() || null : null;
  const { data, error } = await createReport(supabase, ctx, { dayId });
  if (error) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data });
}
