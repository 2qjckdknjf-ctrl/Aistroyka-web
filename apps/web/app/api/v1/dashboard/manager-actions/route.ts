/**
 * GET /api/v1/dashboard/manager-actions — internal manager daily action feed.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { buildManagerActions } from "@/lib/domain/dashboard/manager-actions.service";

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

  if (!canManageProjects(ctx)) {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const data = await buildManagerActions(supabase, ctx);
  return NextResponse.json({ data });
}
