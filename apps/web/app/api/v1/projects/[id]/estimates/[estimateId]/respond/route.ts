/**
 * POST /api/v1/projects/:id/estimates/:estimateId/respond
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { respondToCustomerEstimate } from "@/lib/domain/customer-estimates/customer-estimates.service";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; estimateId: string }> }
) {
  const { id: projectId, estimateId } = await context.params;
  if (!projectId || !estimateId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
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
  const body = await request.json().catch(() => ({}));
  const decision = body.decision === "approve" ? "approve" : body.decision === "reject" ? "reject" : null;
  if (!decision) return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  const supabase = await createClientFromRequest(request);
  const { data, error } = await respondToCustomerEstimate(
    supabase,
    ctx,
    projectId,
    estimateId,
    decision,
    typeof body.note === "string" ? body.note : null
  );
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Respond failed" }, { status: 400 });
  return jsonWithCustomerFinanceGuard("POST /api/v1/projects/:id/estimates/:estimateId/respond", { data });
}
