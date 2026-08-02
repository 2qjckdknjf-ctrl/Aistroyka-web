/**
 * GET /api/v1/portal/projects/:id/change-orders/:changeOrderId
 * Portal surface — always customer-safe public detail + finance guard.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { getChangeOrderDetail } from "@/lib/domain/change-orders/change-orders.service";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

const ROUTE = "GET /api/v1/portal/projects/:id/change-orders/:changeOrderId";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const { id: projectId, changeOrderId } = await context.params;
  if (!projectId || !changeOrderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const { data, error } = await getChangeOrderDetail(supabase, ctx, projectId, changeOrderId, {
    forcePublic: true,
  });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });
  return jsonWithCustomerFinanceGuard(ROUTE, { data, audience: "stakeholder" });
}
