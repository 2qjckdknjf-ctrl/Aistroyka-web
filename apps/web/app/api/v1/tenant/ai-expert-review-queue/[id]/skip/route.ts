/**
 * POST /api/v1/tenant/ai-expert-review-queue/:id/skip
 */

import { NextResponse } from "next/server";
import { createClientFromRequest, getSessionUser } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { hasMinRole } from "@/lib/auth/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  isExpertReviewQueueEnabled,
  isExpertReviewAdminUiEnabled,
  skipExpertReviewQueueItem,
} from "@/lib/platform/ai-flywheel/expert-review-queue";

export const dynamic = "force-dynamic";

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

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  const result = await skipExpertReviewQueueItem(
    admin,
    ctx.tenantId!,
    queueId,
    user?.id ?? ctx.userId ?? ""
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "skip_failed" }, { status: 400 });
  }

  return NextResponse.json({ data: { skipped: true } });
}
