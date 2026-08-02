/**
 * PATCH /api/v1/recurring-operations/rules/:id
 * Toggle active (owner/admin only; matches RLS).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { updateRuleActive } from "@/lib/domain/recurring-operations/recurring-operations.repository";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

  if (!ctx.tenantId || (ctx.role !== "owner" && ctx.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { active?: boolean };
  try {
    body = (await request.json()) as { active?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active boolean required" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const ok = await updateRuleActive(supabase, ctx.tenantId, id, body.active);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
