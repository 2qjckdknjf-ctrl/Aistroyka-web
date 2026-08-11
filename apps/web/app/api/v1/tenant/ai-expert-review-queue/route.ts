/**
 * GET /api/v1/tenant/ai-expert-review-queue
 * Owner/admin only. Lists pending queue items (scrubbed JSON).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { hasMinRole } from "@/lib/auth/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  isExpertReviewQueueEnabled,
  isExpertReviewAdminUiEnabled,
  listPendingQueueItems,
} from "@/lib/platform/ai-flywheel/expert-review-queue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isExpertReviewQueueEnabled() || !isExpertReviewAdminUiEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

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

  const items = await listPendingQueueItems(admin, ctx.tenantId!, 50);

  return NextResponse.json({
    data: items.map((item) => ({
      id: item.id,
      taskType: item.task_type,
      audience: item.audience,
      status: item.status,
      priority: item.priority,
      provenance: item.provenance,
      sourceTable: item.source_table,
      inputJson: item.input_json,
      modelOutputJson: item.model_output_json,
      createdAt: item.created_at,
    })),
  });
}
