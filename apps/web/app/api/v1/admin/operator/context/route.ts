import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/operator/context
 * Minimal operator context for tenant-scoped actions from UI.
 */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  return NextResponse.json({
    data: {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      role: ctx.membership.role,
    },
  });
}
