import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getSloDaily } from "@/lib/sre/slo.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/slo/tenants/:tenantId?range=30d
 * Returns SLO daily stats for the given tenant. Caller must be admin for that tenant (same tenant only in v1).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;
  const { tenantId } = await params;
  if (tenantId !== ctx.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "30d";
  const rangeDays = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const supabase = await createClient();
  const rows = await getSloDaily(supabase, { tenantId, rangeDays });
  return NextResponse.json({ data: rows, range: `${rangeDays}d` });
}
