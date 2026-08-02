/**
 * GET /api/v1/projects/:id/stakeholder-activity
 * Wave 4 Step 9 — portal/stakeholder activity timeline (audience-shaped read model).
 * Not notifications; not the generic /timeline feed.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import {
  getStakeholderActivityTimeline,
  shapeManagerAudience,
  shapeStakeholderAudience,
} from "@/lib/domain/projects/stakeholder-activity-timeline.repository";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

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

  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit")) || 50), 100);

  const supabase = await createClientFromRequest(request);

  const internal = await getProjectForInternalWorkspace(supabase, ctx, projectId);
  if (internal.data && !internal.error) {
    const raw = await getStakeholderActivityTimeline(supabase, {
      tenantId: ctx.tenantId,
      projectId,
      viewer: "manager",
      userId: ctx.userId,
      limit,
    });
    return NextResponse.json({ audience: "manager", data: shapeManagerAudience(raw) });
  }

  if (await canReadClientPortalView(supabase, ctx, projectId)) {
    const raw = await getStakeholderActivityTimeline(supabase, {
      tenantId: ctx.tenantId,
      projectId,
      viewer: "stakeholder",
      userId: ctx.userId,
      limit,
    });
    return jsonWithCustomerFinanceGuard("GET /api/v1/projects/:id/stakeholder-activity", {
      audience: "stakeholder",
      data: shapeStakeholderAudience(raw),
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
