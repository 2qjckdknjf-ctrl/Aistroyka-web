import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole, getRoleInTenant } from "@/lib/auth/tenant";

/**
 * POST: revoke an internal workspace member.
 *
 * Effective offboarding spans all internal membership layers created by invite accept:
 * tenant_members + account_members + project_members. Stakeholder/portal membership is
 * intentionally separate and is managed by the stakeholder revoke flow.
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

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("user_id, account_id")
    .eq("id", tenantId)
    .single();
  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? "Tenant not found" }, { status: 500 });
  }
  if (tenant.user_id === targetUserId) {
    return NextResponse.json({ error: "Cannot revoke owner" }, { status: 400 });
  }

  const { data: targetMember, error: memberError } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const myRole = await getRoleInTenant(supabase, tenantId);
  if (targetMember?.role === "owner") {
    return NextResponse.json({ error: "Cannot revoke owner" }, { status: 400 });
  }
  if (targetMember?.role === "admin" && myRole !== "owner") {
    return NextResponse.json({ error: "Only owner can revoke an admin" }, { status: 403 });
  }

  // All remaining mutations require server credentials. Do not return an early
  // idempotent success only because tenant_members is already gone: account/project
  // memberships may still need cleanup from an earlier partial revoke.
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Revoke requires server credentials" }, { status: 503 });
  }

  let accountMember: { role?: string; status?: string } | null = null;
  if (tenant.account_id) {
    const { data, error } = await admin
      .from("account_members")
      .select("role, status")
      .eq("account_id", tenant.account_id)
      .eq("user_id", targetUserId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    accountMember = data;

    if (accountMember?.role === "owner") {
      return NextResponse.json({ error: "Cannot revoke owner" }, { status: 400 });
    }
    if (accountMember?.role === "admin" && myRole !== "owner") {
      return NextResponse.json({ error: "Only owner can revoke an admin" }, { status: 403 });
    }
  }

  if (targetMember) {
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
  }

  if (tenant.account_id && accountMember && accountMember.status !== "removed") {
    const { error } = await admin
      .from("account_members")
      .update({ status: "removed" })
      .eq("account_id", tenant.account_id)
      .eq("user_id", targetUserId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Remove latent project access as well. Otherwise a later tenant re-invite could
  // reactivate old project access because project_members rows would still be active.
  const { error: projectMemberError } = await admin
    .from("project_members")
    .update({ status: "removed" })
    .eq("tenant_id", tenantId)
    .eq("user_id", targetUserId)
    .neq("status", "removed");
  if (projectMemberError) {
    return NextResponse.json({ error: projectMemberError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
