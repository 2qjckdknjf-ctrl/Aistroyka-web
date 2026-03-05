/**
 * POST /api/v1/admin/tenants/:id/flags — set flag for a tenant (toggle).
 * Body: { key: string, enabled: boolean, variant?: string }.
 * Only for same-tenant (admin) or platform scope.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { setTenantFlag } from "@/lib/platform/flags";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
  const adminErr = requireAdmin(ctx, "write");
  if (adminErr) return adminErr;
  const { id: tenantId } = await params;
  if (!tenantId) return NextResponse.json({ error: "Missing tenant id" }, { status: 400 });
  if (tenantId !== ctx.tenantId) {
    return NextResponse.json({ error: "Can only set flags for own tenant" }, { status: 403 });
  }
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
  const enabled = Boolean(body.enabled);
  const variant = typeof body.variant === "string" ? body.variant.trim() || null : null;
  const { error } = await setTenantFlag(admin, tenantId, key, enabled, variant);
  if (error) return NextResponse.json({ error }, { status: 500 });
  await emitAudit(admin, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    action: "tenant_flag_set",
    resource_type: "tenant_feature_flag",
    resource_id: `${tenantId}:${key}`,
    details: { key, enabled, variant },
  });
  return NextResponse.json({ success: true, key, enabled, variant });
}
