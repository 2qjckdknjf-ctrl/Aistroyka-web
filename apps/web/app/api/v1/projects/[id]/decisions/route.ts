/**
 * GET /api/v1/projects/:id/decisions — customer-safe Phase 3 decision list.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { listClientRequests } from "@/lib/domain/client-requests/client-requests.service";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });
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
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listClientRequests(supabase, ctx, projectId, {
    viewer: "stakeholder",
    status: "all",
  });
  if (error) return NextResponse.json({ error }, { status: 403 });
  return jsonWithCustomerFinanceGuard("GET /api/v1/projects/:id/decisions", { data });
}
