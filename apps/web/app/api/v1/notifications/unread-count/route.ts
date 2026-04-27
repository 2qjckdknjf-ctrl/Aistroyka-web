import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { unreadCount } from "@/lib/domain/notifications/manager-notifications.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/notifications/unread-count — unread count for current user. */
export async function GET(request: Request) {
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
  const count = await unreadCount(supabase, ctx.tenantId, ctx.userId);
  return NextResponse.json({ count });
}
