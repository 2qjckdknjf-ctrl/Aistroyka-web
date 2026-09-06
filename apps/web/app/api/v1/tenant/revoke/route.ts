import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole, getRoleInTenant } from "@/lib/auth/tenant";

/**
 * POST: revoke an internal tenant member. Body: { user_id: string }.
 * Admin+ can revoke; cannot revoke the tenant owner; only owner can revoke admin.
 *
 * Effective offboarding removes project_members first, then tenant_members. Portal
 * stakeholder access is a separate customer-facing identity and is intentionally
 * not mutated by this internal Team action.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant" }, { status: 403 });
  }

  const canRevoke = await hasMinRole(supabase, tenantId, "admin");
  if (!canRevoke) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const targetUserId = typeof body.user_id === "string" ? body.user_id.trim() : "";
  if (!targetUserId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("id", tenantId)
    .single();
  if (tenant?.user_id === targetUserId) {
    return NextResponse.json({ error: "Cannot revoke owner" }, { status: 400 });
  }

  const { data: targetMember } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  const myRole = await getRoleInTenant(supabase, tenantId);
  if (targetMember?.role === "admin" && myRole !== "owner") {
    return NextResponse.json({ error: "Only owner can revoke an admin" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Revoke requires server credentials" }, { status: 503 });
  }

  // Project membership is independently trusted by project-scoped authorization
  // helpers. Remove it first so a partial failure can only reduce access.
  const { error: projectMembershipError } = await admin
    .from("project_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId);
  if (projectMembershipError) {
    return NextResponse.json({ error: projectMembershipError.message }, { status: 500 });
  }

  // Idempotent cleanup: if the tenant membership is already absent, the project
  // membership cleanup above still repairs any stale effective access.
  if (!targetMember) {
    return NextResponse.json({ data: { ok: true } });
  }

  const { data: deleted, error } = await admin
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId)
    .select("user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!deleted?.length) {
    return NextResponse.json({ error: "Revoke failed" }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
