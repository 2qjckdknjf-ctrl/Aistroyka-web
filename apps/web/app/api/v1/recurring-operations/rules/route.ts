/**
 * GET /api/v1/recurring-operations/rules
 * List recurring operational rules for the tenant (manager-facing).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { listRulesForTenant } from "@/lib/domain/recurring-operations/recurring-operations.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  if (!ctx.tenantId || !canManageProjects(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const rules = await listRulesForTenant(supabase, ctx.tenantId);
  const canToggle = ctx.role === "owner" || ctx.role === "admin";
  return NextResponse.json({ data: { rules, canToggle } });
}
