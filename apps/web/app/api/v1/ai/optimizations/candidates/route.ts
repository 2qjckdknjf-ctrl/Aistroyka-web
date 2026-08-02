/**
 * GET /api/v1/ai/optimizations/candidates — AI Brain Phase E.
 * List improvement candidates eligible for optimization proposal. Auth: tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getCandidates } from "@/lib/ai-brain/phase-d/improvement/improvement.service";

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

  const url = new URL(request.url);
  const reviewStatus = url.searchParams.get("reviewStatus") as
    | "pending"
    | "approved"
    | "rejected"
    | null;

  const supabase = await createClientFromRequest(request);
  const candidates = await getCandidates(supabase, {
    tenantId: ctx.tenantId ?? null,
    reviewStatus: reviewStatus ?? undefined,
  });

  return NextResponse.json({
    data: {
      candidates: candidates.map((c) => ({
        id: c.id,
        source: c.source,
        targetLayer: c.targetLayer,
        rationale: c.rationale,
        expectedGain: c.expectedGain,
        risk: c.risk,
        readiness: c.readiness,
        reviewStatus: c.reviewStatus,
        createdAt: c.createdAt,
      })),
    },
  });
}
