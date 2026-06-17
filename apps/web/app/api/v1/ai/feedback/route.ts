/**
 * POST /api/v1/ai/feedback — AI Brain Phase D feedback submission.
 * Structured feedback on AI outputs. Auth: tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  submitFeedback,
  parsePreferencePairFromBody,
  validateFeedbackCategory,
  validateSourceKind,
  validateScore,
  validateLinkedRefs,
} from "@/lib/ai-brain/phase-d/feedback/feedback.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const runId = typeof body.runId === "string" ? body.runId.trim() : "";
  const sourceKind = body.sourceKind;
  const feedbackCategory = body.feedbackCategory;

  if (!runId) {
    return NextResponse.json({ error: "runId required" }, { status: 400 });
  }
  if (!validateSourceKind(sourceKind)) {
    return NextResponse.json({ error: "Invalid sourceKind" }, { status: 400 });
  }
  if (!validateFeedbackCategory(feedbackCategory)) {
    return NextResponse.json({ error: "Invalid feedbackCategory" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const admin = getAdminClient();
  const preferencePair = parsePreferencePairFromBody(body);

  const result = await submitFeedback(
    supabase,
    {
      runId,
      tenantId: ctx.tenantId!,
      sourceKind: sourceKind as "human" | "system" | "test",
      feedbackCategory: feedbackCategory as Parameters<typeof submitFeedback>[1]["feedbackCategory"],
      reviewerRole: typeof body.reviewerRole === "string" ? body.reviewerRole : undefined,
      factualityScore: validateScore(body.factualityScore) ?? undefined,
      usefulnessScore: validateScore(body.usefulnessScore) ?? undefined,
      safetyScore: validateScore(body.safetyScore) ?? undefined,
      roleFitScore: validateScore(body.roleFitScore) ?? undefined,
      completenessScore: validateScore(body.completenessScore) ?? undefined,
      comments: typeof body.comments === "string" ? body.comments : undefined,
      linkedRefs: validateLinkedRefs(body.linkedRefs),
      preferencePair,
    },
    { adminClient: admin }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ data: { feedbackId: result.feedbackId } });
}
