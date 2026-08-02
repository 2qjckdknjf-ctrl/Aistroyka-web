/**
 * POST /api/v1/projects/:id/stakeholder-discussions/:discussionId/close
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { closeDiscussion } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; discussionId: string }> }) {
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
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { ok, error } = await closeDiscussion(supabase, ctx, projectId, discussionId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error: error || "Close failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
