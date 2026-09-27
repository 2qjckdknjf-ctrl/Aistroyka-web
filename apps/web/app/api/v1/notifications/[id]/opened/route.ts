import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { openFactsForUser } from "@/lib/domain/notifications/manager-notifications.repository";
import { recordNotificationOpened } from "@/lib/growth/product-events";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/notifications/:id/opened
 * Records that the signed-in user opened this inbox notification's target.
 * Does not mark the row read and does not fail the open when telemetry stalls.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Tenant and user required" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const facts = await openFactsForUser(supabase, id, ctx.tenantId, ctx.userId);
  if (!facts) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await recordNotificationOpened({
      writer: getAdminClient() ?? supabase,
      admin: getAdminClient(),
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      notificationId: id,
      role: ctx.role,
      clientHeader: ctx.clientProfile,
      notificationType: facts.type,
      destinationKind: facts.target_type,
    });
  } catch {
    // Opening the target must not fail when telemetry fails.
  }
  return NextResponse.json({ ok: true });
}
