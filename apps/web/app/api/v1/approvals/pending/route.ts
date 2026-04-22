import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { listPendingApprovals } from "@/lib/domain/approvals/pending-approvals.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/approvals/pending — unified manager approvals workload. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  if (!canReviewReport(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  const supabase = await createClientFromRequest(request);
  const data = await listPendingApprovals(supabase, ctx.tenantId!, limit);
  return NextResponse.json({ data });
}
