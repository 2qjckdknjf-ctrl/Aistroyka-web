/**
 * GET /api/v1/me — current user's tenant context (tenant_id, user_id, role).
 * For manager/worker apps to gate on role. Returns 200 with nulls when not in a tenant.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { isTenantContextPresent } from "@/lib/tenant/tenant.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx.userId) {
    return NextResponse.json({ data: { tenant_id: null, user_id: null, role: null } });
  }
  const data = {
    tenant_id: ctx.tenantId ?? null,
    user_id: ctx.userId,
    role: isTenantContextPresent(ctx) ? ctx.role : null,
  };
  return NextResponse.json({ data });
}
