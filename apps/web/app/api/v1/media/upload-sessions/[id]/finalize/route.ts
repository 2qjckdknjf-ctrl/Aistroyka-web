import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { finalizeUploadSession } from "@/lib/domain/upload-session/upload-session.service";
import { checkRequestBodySize } from "@/lib/api/request-limit";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/media/upload-sessions/:id/finalize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sizeError = checkRequestBodySize(request);
  if (sizeError) return NextResponse.json({ error: sizeError }, { status: 413 });
  const { id: sessionId } = await params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return guard.response;
  let body: { object_path?: string; mime_type?: string; size_bytes?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const object_path = typeof body.object_path === "string" ? body.object_path.trim() : "";
  if (!object_path) return NextResponse.json({ error: "object_path required" }, { status: 400 });
  const supabase = await createClient();
  const result = await finalizeUploadSession(supabase, ctx, sessionId, {
    object_path,
    mime_type: typeof body.mime_type === "string" ? body.mime_type : undefined,
    size_bytes: typeof body.size_bytes === "number" ? body.size_bytes : undefined,
  });
  if (!result.ok) {
    const status =
      result.code === "media_object_missing"
        ? 400
        : result.code === "storage_unavailable"
          ? 503
          : 403;
    return NextResponse.json(
      { error: result.error, ...(result.code ? { code: result.code } : {}) },
      { status }
    );
  }
  const response = { ok: true };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return NextResponse.json(response);
}
