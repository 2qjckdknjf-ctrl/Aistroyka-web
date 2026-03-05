/**
 * GET /api/v1/media/:mediaId/collab — annotations + comments for media.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(
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
  const supabase = await createClient();
  const [annRes, comRes] = await Promise.all([
    supabase.from("photo_annotations").select("id, type, data, version, author_user_id, created_at, updated_at").eq("tenant_id", ctx.tenantId).eq("media_id", mediaId).order("created_at"),
    supabase.from("photo_comments").select("id, body, author_user_id, created_at").eq("tenant_id", ctx.tenantId).eq("media_id", mediaId).order("created_at"),
  ]);
  return NextResponse.json({
    data: {
      annotations: annRes.data ?? [],
      comments: comRes.data ?? [],
    },
  });
}
