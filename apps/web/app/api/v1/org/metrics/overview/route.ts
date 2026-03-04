import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasOrgAdminRole, getTenantIdsForOrg } from "@/lib/domain/org";
import { getMetricsOverviewForTenantIds } from "@/lib/observability/metrics.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/org/metrics/overview?range=30d
 * Requires x-organization-id header. Caller must be org_owner or org_admin.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = request.headers.get("x-organization-id")?.trim();
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-organization-id" }, { status: 400 });
  }
  const allowed = await hasOrgAdminRole(supabase, orgId, user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const tenantIds = await getTenantIdsForOrg(supabase, orgId);
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "30d";
  const rangeDays = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const rows = await getMetricsOverviewForTenantIds(supabase, tenantIds, rangeDays);
  return NextResponse.json({ data: rows, range: `${rangeDays}d` });
}
