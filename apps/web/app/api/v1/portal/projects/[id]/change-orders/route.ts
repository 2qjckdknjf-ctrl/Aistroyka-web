/**
 * GET /api/v1/portal/projects/:id/change-orders — customer portal alias (same as projects route for GET).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { listChangeOrders } from "@/lib/domain/change-orders/change-orders.service";
import { assertCustomerFinanceSafePayload } from "@/lib/security/customer-finance-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  // Portal is always a customer surface — never return manager-internal CO rows.
  const { data, error } = await listChangeOrders(supabase, ctx, projectId, { forcePublic: true });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  const payload = { data: data ?? [] };
  const safety = assertCustomerFinanceSafePayload(payload);
  if (!safety.ok) {
    console.error(
      `Blocked customer-finance leak in /api/v1/portal/projects/${projectId}/change-orders: ${safety.path ?? safety.key}`
    );
    return NextResponse.json({ error: "Portal payload failed finance safety guard" }, { status: 500 });
  }
  return NextResponse.json(payload);
}
