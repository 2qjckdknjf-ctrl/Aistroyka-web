/**
 * GET /api/v1/projects/:id/stakeholder-notifications
 * Portal stakeholders: list in-app notifications for this project.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { canStakeholderAccessClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import * as notifRepo from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.repository";
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

  const supabase = await createClientFromRequest(request);
  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canStakeholderAccessClientRequests(supabase, ctx, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const rows = await notifRepo.listForUser(supabase, ctx.tenantId, projectId, ctx.userId, { limit });
  const unread = await notifRepo.unreadCount(supabase, ctx.tenantId, projectId, ctx.userId);
  const data = rows.map((r) => notifRepo.rowToPublic(r));
  return jsonWithCustomerFinanceGuard("GET /api/v1/projects/:id/stakeholder-notifications", { data, unread });
}
