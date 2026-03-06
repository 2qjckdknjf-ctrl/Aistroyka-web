import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** GET /api/v1/workers/:userId/summary — reports count and media count for worker (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClient();
  const { data: reportRows, count: reportsCount } = await supabase
    .from("worker_reports")
    .select("id", { count: "exact" })
    .eq("tenant_id", ctx.tenantId!)
    .eq("user_id", userId)
    .limit(5000);

  const ids = (reportRows ?? []).map((r) => (r as { id: string }).id);
  let mediaCount = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from("worker_report_media")
      .select("id", { count: "exact", head: true })
      .in("report_id", ids);
    mediaCount = count ?? 0;
  }

  return NextResponse.json({
    data: {
      reports_count: reportsCount ?? 0,
      media_count: mediaCount,
    },
  });
}
