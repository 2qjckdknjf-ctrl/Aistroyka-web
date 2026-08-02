import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/tenant/tenant-membership.server";
import { mapInvitationDbError } from "@/lib/tenant/invitation-errors";

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getOrCreateTenantForCurrentUser(supabase, request);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 403 });

  if (!(await hasMinRole(supabase, tenantId, "admin"))) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("tenant_invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    const mapped = mapInvitationDbError(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json({ error: "Unable to list invitations." }, { status: 500 });
  }

  return NextResponse.json({ data: rows ?? [] });
}
