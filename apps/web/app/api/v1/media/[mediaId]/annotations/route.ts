/**
 * POST /api/v1/media/:mediaId/annotations — create annotation. Body: { type, data }.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createAnnotation } from "@/lib/domain/media/annotation.service";

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
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const data = body.data && typeof body.data === "object" ? body.data : {};
  
  const supabase = await createClient();
  const { data: annotation, error } = await createAnnotation(supabase, ctx, mediaId, type, data);
  
  if (error) {
    const status = error === "Unauthorized" ? 401 : error.includes("required") ? 400 : 500;
    return NextResponse.json({ error }, { status });
  }
  
  if (!annotation) {
    return NextResponse.json({ error: "Failed to create annotation" }, { status: 500 });
  }
  
  return NextResponse.json({ data: annotation });
}
