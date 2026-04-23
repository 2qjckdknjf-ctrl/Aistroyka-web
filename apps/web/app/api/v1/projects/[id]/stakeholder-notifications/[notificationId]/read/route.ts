/**
 * POST /api/v1/projects/:id/stakeholder-notifications/:notificationId/read
 * Portal recipients: mark one notification as read.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { canStakeholderAccessClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import * as notifRepo from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.repository";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; notificationId: string }> }
) {
  const { id: projectId, notificationId } = await context.params;
  if (!projectId || !notificationId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  if (!(await canStakeholderAccessClientRequests(supabase, ctx, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ok = await notifRepo.markRead(supabase, notificationId, ctx.tenantId, ctx.userId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
