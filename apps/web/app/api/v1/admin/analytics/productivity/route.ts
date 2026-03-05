import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { getProductivity } from "@/lib/platform/analytics/analytics.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  if (!authorize(ctx, "admin:read")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "30d";
  const rangeDays = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const projectId = url.searchParams.get("projectId") ?? null;
  const supabase = await createClient();
  const data = await getProductivity(supabase, ctx.tenantId, rangeDays, projectId);
  return NextResponse.json({ data, range: `${rangeDays}d` });
}
