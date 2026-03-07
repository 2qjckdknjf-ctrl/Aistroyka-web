/**
 * PATCH /api/v1/media/:mediaId/annotations/:id — update annotation. Requires If-Match: version. 409 if version mismatch.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { updateAnnotation } from "@/lib/domain/media/annotation.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mediaId: string; id: string }> }
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const ifMatch = request.headers.get("if-match");
  const versionMatch = ifMatch?.trim().match(/^\s*(\d+)\s*$/);
  const expectedVersion = versionMatch ? parseInt(versionMatch[1], 10) : null;
  if (expectedVersion == null) {
    return NextResponse.json({ error: "If-Match version required" }, { status: 400 });
  }

  const { mediaId, id } = await params;
  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type.trim() : undefined;
  const data = body.data && typeof body.data === "object" ? body.data : undefined;

  const supabase = await createClient();
  const { data: annotation, error, statusCode } = await updateAnnotation(
    supabase,
    ctx,
    mediaId,
    id,
    expectedVersion,
    { type, data }
  );

  if (error) {
    const status = statusCode ?? (error === "Unauthorized" ? 401 : error === "Not found" ? 404 : error === "Conflict" ? 409 : 500);
    return NextResponse.json({ error }, { status });
  }

  if (!annotation) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ data: annotation });
}
