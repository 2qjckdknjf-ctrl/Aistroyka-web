/**
 * POST /api/v1/media/:mediaId/comments — add comment (append-only).
 * GET not here; use GET .../collab for annotations + comments.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createComment } from "@/lib/domain/media/comment.service";

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
  
  const supabase = await createClient();
  const { data: comment, error } = await createComment(supabase, ctx, mediaId, bodyText);
  
  if (error) {
    const status = error === "Unauthorized" ? 401 : error.includes("required") ? 400 : 500;
    return NextResponse.json({ error }, { status });
  }
  
  if (!comment) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
  
  return NextResponse.json({ data: comment });
}
