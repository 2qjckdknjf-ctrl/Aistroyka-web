/**
 * GET /api/v1/me — current user's tenant context (tenant_id, user_id, role, tenant_name).
 * For manager/worker apps to gate on role. Returns 200 with nulls when not in a tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { isTenantContextPresent } from "@/lib/tenant/tenant.types";

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
