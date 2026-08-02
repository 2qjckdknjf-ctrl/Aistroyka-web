/**
 * POST /api/v1/projects/:id/estimates/:estimateId/send
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { sendCustomerEstimate } from "@/lib/domain/customer-estimates/customer-estimates.service";

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
  const supabase = await createClientFromRequest(request);
  const { data, error } = await sendCustomerEstimate(supabase, ctx, projectId, estimateId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Send failed" }, { status: 400 });
  return NextResponse.json({ data });
}
