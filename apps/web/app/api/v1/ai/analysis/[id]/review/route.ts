/**
 * POST /api/v1/ai/analysis/:id/review
 * Manager/admin human verdict on a durable vision result.
 * Contractor-internal only. Never a customer/portal surface.
 * Accepted/edited are Graph-eligible; this route does not mutate Graph overlays.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import { reviewAiAnalysis, validateReviewVerdict } from "@/lib/domain/ai-analysis/review.service";
import { emitAudit } from "@/lib/observability/audit.service";
import { createClientFromRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: analysisId } = await params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.message.includes("membership") ? 403 : 401 }
      );
    }
    throw e;
  }

  // Stakeholder/viewer/member without manage rights cannot record evidence verdicts.
  if (!canManageTasks(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = validateReviewVerdict(body.status ?? body.verdict);
  if (!status) {
    return NextResponse.json(
      {
        error:
          "status must be accepted, edited, rejected, or insufficient_evidence",
      },
      { status: 400 }
    );
  }

  const note =
    typeof body.note === "string"
      ? body.note
      : typeof body.comment === "string"
        ? body.comment
        : null;

  const correctedRaw = body.corrected_payload ?? body.correctedPayload ?? null;
  const correctedPayload =
    correctedRaw !== null && typeof correctedRaw === "object" && !Array.isArray(correctedRaw)
      ? (correctedRaw as {
          stage?: string | null;
          completion_percent?: number | null;
          risk_level?: string | null;
          detected_issues?: string[] | null;
          recommendations?: string[] | null;
        })
      : null;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  }

  const result = await reviewAiAnalysis(admin, {
    analysisId,
    tenantId: ctx.tenantId!,
    reviewerUserId: ctx.userId!,
    status,
    note,
    correctedPayload,
  });

  if (!result.ok) {
    const http =
      result.code === "NOT_FOUND" ? 404 : result.code === "INVALID_INPUT" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  const supabase = await createClientFromRequest(request);
  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "ai_analysis_human_review",
    resource_type: "ai_analysis",
    resource_id: result.analysisId,
    details: {
      status: result.reviewStatus,
      graph_eligible: result.graphEligible,
      correction_id: result.correctionId,
      note: note && String(note).trim() ? String(note).trim().slice(0, 2000) : null,
      source: "manager",
    },
  });

  return NextResponse.json(
    {
      data: {
        analysis_id: result.analysisId,
        review_status: result.reviewStatus,
        graph_eligible: result.graphEligible,
        reviewed_at: result.reviewedAt,
        reviewed_by: result.reviewedBy,
        correction_id: result.correctionId,
      },
    },
    { status: 200 }
  );
}
