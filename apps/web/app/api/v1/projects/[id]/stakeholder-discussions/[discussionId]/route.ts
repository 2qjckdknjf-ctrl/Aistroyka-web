/**
 * GET /api/v1/projects/:id/stakeholder-discussions/:discussionId
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { getDiscussionDetail } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.service";
import { canManageStakeholderDiscussions } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.policy";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string; discussionId: string }> }) {
  const { id: projectId, discussionId } = await context.params;
  if (!projectId || !discussionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getDiscussionDetail(supabase, ctx, projectId, discussionId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });

  const isManager = await canManageStakeholderDiscussions(supabase, ctx, projectId);
  return NextResponse.json({ data, audience: isManager ? "manager" : "stakeholder" });
}
