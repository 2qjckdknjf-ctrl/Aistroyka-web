/**
 * GET /api/v1/me — current user's tenant context (tenant_id, user_id, role, tenant_name).
 * For manager/worker apps to gate on role. Returns 200 with nulls when not in a tenant.
 * DELETE /api/v1/me — delete the authenticated Auth user (body `{ confirm: "DELETE" }`).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { isTenantContextPresent } from "@/lib/tenant/tenant.types";
import { getAdminClient } from "@/lib/supabase/admin";
import { emitAudit } from "@/lib/observability/audit.service";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { getRequestClientIp } from "@/lib/platform-owner/client-ip";
import { deleteOwnAccountRecords, isAccountDeleteConfirm, type AccountDeletionAdmin } from "@/lib/auth/delete-own-account";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx.userId) {
    return NextResponse.json({ data: { tenant_id: null, user_id: null, role: null, tenant_name: null } });
  }

  let tenant_name: string | null = null;
  if (ctx.tenantId) {
    try {
      const supabase = await createClientFromRequest(request);
      const { data } = await supabase.from("tenants").select("name").eq("id", ctx.tenantId).maybeSingle();
      tenant_name = typeof data?.name === "string" && data.name.trim() ? data.name : null;
    } catch {
      tenant_name = null;
    }
  }

  const data = {
    tenant_id: ctx.tenantId ?? null,
    user_id: ctx.userId,
    role: isTenantContextPresent(ctx) ? ctx.role : null,
    tenant_name,
  };
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx.userId) {
    return NextResponse.json({ error: "Authentication required", code: "unauthenticated" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (!isAccountDeleteConfirm(body)) {
    return NextResponse.json(
      { error: "Confirmation required", code: "confirm_required" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable", code: "admin_unavailable" }, { status: 503 });
  }

  try {
    const ip = getRequestClientIp(request) ?? "unknown";
    const rl = await checkRateLimit(admin, {
      tenantId: ctx.tenantId ?? null,
      ip,
      endpoint: "/api/v1/me",
    });
    if (rl.limited) {
      return NextResponse.json({ error: rl.message, code: "rate_limited" }, { status: 429 });
    }
  } catch {
    // Rate-limit store optional; deletion still proceeds.
  }

  const { error } = await deleteOwnAccountRecords(admin as AccountDeletionAdmin, ctx.userId);
  if (error) {
    return NextResponse.json({ error, code: "delete_failed" }, { status: 500 });
  }

  if (ctx.tenantId) {
    await emitAudit(admin, {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      action: "account_delete",
      resource_type: "auth_user",
      resource_id: ctx.userId,
    });
  }

  return NextResponse.json({ ok: true });
}
