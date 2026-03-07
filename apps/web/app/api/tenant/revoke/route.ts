import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { revokeMembership } from "@/lib/domain/tenants/tenant.service";
import * as repo from "@/lib/domain/tenants/tenant.repository";
import { getRoleInTenant } from "@/lib/auth/tenant";

/** POST: revoke member. Body: { user_id: string }. Admin+ can revoke; cannot revoke owner. */
export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  // Check authorization
  if (!authorize(ctx, "tenant:invite")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const targetUserId = typeof body.user_id === "string" ? body.user_id.trim() : "";
  if (!targetUserId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  // Additional check: only owner can revoke admin
  const supabase = await createClient();
  const targetRole = await repo.getMemberRole(supabase, ctx.tenantId!, targetUserId);
  const myRole = await getRoleInTenant(supabase, ctx.tenantId!);
  if (targetRole === "admin" && myRole !== "owner") {
    return NextResponse.json({ error: "Only owner can revoke an admin" }, { status: 403 });
  }

  const { ok, error } = await revokeMembership(supabase, ctx, targetUserId);

  if (error) {
    const status = error === "Unauthorized" ? 401 : error === "Insufficient rights" ? 403 : error.includes("Cannot revoke") ? 400 : 500;
    return NextResponse.json({ error }, { status });
  }

  if (!ok) {
    return NextResponse.json({ error: "Failed to revoke membership" }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
