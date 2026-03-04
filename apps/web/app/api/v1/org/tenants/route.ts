import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasOrgAdminRole, getTenantIdsForOrg } from "@/lib/domain/org";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/org/tenants
 * Requires x-organization-id header. Caller must be org_owner or org_admin.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  return NextResponse.json({ data: { tenant_ids: tenantIds } });
}
