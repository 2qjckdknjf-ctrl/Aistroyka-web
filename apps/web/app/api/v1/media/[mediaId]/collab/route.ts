/**
 * GET /api/v1/media/:mediaId/collab — annotations + comments for media.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getMediaCollab } from "@/lib/domain/media/media-collab.service";

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
  const { data, error } = await getMediaCollab(supabase, ctx, mediaId);

  if (error) {
    const status = error === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Media collaboration data not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
