/**
 * POST /api/v1/media/:mediaId/comments — add comment (append-only).
 * GET not here; use GET .../collab for annotations + comments.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { emitChange } from "@/lib/sync/change-log.repository";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const { mediaId } = await params;
  if (!mediaId) return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  if (!bodyText) return NextResponse.json({ error: "body required" }, { status: 400 });
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("photo_comments")
    .insert({
      tenant_id: ctx.tenantId,
      media_id: mediaId,
      author_user_id: ctx.userId,
      body: bodyText,
    })
    .select("id, body, author_user_id, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const admin = (await import("@/lib/supabase/admin")).getAdminClient();
  if (admin) await emitChange(admin, { tenant_id: ctx.tenantId, resource_type: "media", resource_id: mediaId, change_type: "updated", changed_by: ctx.userId, payload: { comment_id: (row as { id: string }).id } });
  return NextResponse.json({ data: row });
}
