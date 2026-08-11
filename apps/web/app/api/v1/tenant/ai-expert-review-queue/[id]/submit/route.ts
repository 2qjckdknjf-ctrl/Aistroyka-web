/**
 * POST /api/v1/tenant/ai-expert-review-queue/:id/submit
 */

import { NextResponse } from "next/server";
import { createClientFromRequest, getSessionUser } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { hasMinRole } from "@/lib/auth/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  isExpertReviewQueueEnabled,
  isExpertReviewAdminUiEnabled,
  submitExpertReview,
} from "@/lib/platform/ai-flywheel/expert-review-queue";
import type { ExpertVerdict } from "@/lib/platform/ai-flywheel/expert-review";

export const dynamic = "force-dynamic";

const VERDICTS: ExpertVerdict[] = [
  "model_correct",
  "model_partially_correct",
  "model_wrong",
  "both_models_wrong",
];

function parseBody(body: unknown): {
  verdict: ExpertVerdict;
  expertConclusion: string;
  expertRationale?: string;
  correctedOutputJson?: Record<string, unknown>;
} | null {
  if (typeof body !== "object" || body === null) return null;
  const o = body as Record<string, unknown>;
  const verdict = o.verdict;
  const expertConclusion = o.expertConclusion;
  if (typeof verdict !== "string" || !VERDICTS.includes(verdict as ExpertVerdict)) return null;
  if (typeof expertConclusion !== "string" || !expertConclusion.trim()) return null;
  const expertRationale = typeof o.expertRationale === "string" ? o.expertRationale : undefined;
  const correctedOutputJson =
    o.correctedOutputJson && typeof o.correctedOutputJson === "object"
      ? (o.correctedOutputJson as Record<string, unknown>)
      : undefined;
  return {
    verdict: verdict as ExpertVerdict,
    expertConclusion,
    expertRationale,
    correctedOutputJson,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isExpertReviewQueueEnabled() || !isExpertReviewAdminUiEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { id: queueId } = await context.params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  if (!(await hasMinRole(supabase, ctx.tenantId!, "admin"))) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  const result = await submitExpertReview(admin, {
    queueId,
    tenantId: ctx.tenantId!,
    expertUserId: user?.id ?? ctx.userId ?? "",
    verdict: parsed.verdict,
    expertConclusion: parsed.expertConclusion,
    expertRationale: parsed.expertRationale,
    correctedOutputJson: parsed.correctedOutputJson,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "submit_failed" }, { status: 400 });
  }

  return NextResponse.json({ data: { reviewId: result.reviewId } });
}
