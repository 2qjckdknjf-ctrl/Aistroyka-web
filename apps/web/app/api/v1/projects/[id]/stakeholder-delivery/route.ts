/**
 * GET /api/v1/projects/:id/stakeholder-delivery
 * Internal managers: delivery audit rows for stakeholder notifications on this project.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { canManageProjectStakeholders } from "@/lib/domain/stakeholders/stakeholders.policy";
import * as notifRepo from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.repository";

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
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageProjectStakeholders(supabase, ctx, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const data = await notifRepo.listDeliveryForProject(supabase, ctx.tenantId, projectId, { limit });
  return NextResponse.json({ data });
}
