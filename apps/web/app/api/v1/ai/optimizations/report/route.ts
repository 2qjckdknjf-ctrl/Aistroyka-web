/**
 * GET /api/v1/ai/optimizations/report — AI Brain Phase E.
 * Report on optimization proposals/packages/experiments. Auth: tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listProposals } from "@/lib/ai-brain/phase-e/proposal/proposal.repository";

export const dynamic = "force-dynamic";

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

  const url = new URL(request.url);
  const reviewStatus = url.searchParams.get("reviewStatus") as
    | "pending"
    | "approved"
    | "rejected"
    | null;

  const supabase = await createClientFromRequest(request);
  const proposals = await listProposals(supabase, {
    tenantId: ctx.tenantId ?? null,
    reviewStatus: reviewStatus ?? undefined,
  });

  return NextResponse.json({
    data: {
      proposals: proposals.map((p) => ({
        id: p.id,
        sourceCandidateId: p.sourceCandidateId,
        targetLayer: p.targetLayer,
        rationale: p.rationale,
        expectedGain: p.expectedGain,
        riskLevel: p.riskLevel,
        readiness: p.readiness,
        reviewStatus: p.reviewStatus,
        createdAt: p.createdAt,
      })),
    },
  });
}
