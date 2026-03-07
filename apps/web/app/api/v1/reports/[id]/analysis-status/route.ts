import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getAnalysisStatus } from "@/lib/domain/reports/report.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const ctx = await getTenantContextFromRequest(_request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  const supabase = await createClient();
  const { data, error } = await getAnalysisStatus(supabase, ctx, reportId);

  if (error) {
    const status = error === "Report not found" ? 404 : error === "Insufficient rights" ? 403 : 400;
    return NextResponse.json({ error }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Analysis status not available" }, { status: 404 });
  }

  return NextResponse.json(data);
}
