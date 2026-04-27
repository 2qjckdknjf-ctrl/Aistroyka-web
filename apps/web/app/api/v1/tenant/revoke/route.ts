import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole, getRoleInTenant } from "@/lib/auth/tenant";

/** POST: revoke member. Body: { user_id: string }. Admin+ can revoke; cannot revoke owner. */
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

  const { error } = await supabase
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
