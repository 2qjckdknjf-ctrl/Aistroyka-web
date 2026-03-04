import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { finalizeUploadSession } from "@/lib/domain/upload-session/upload-session.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  let body: { object_path?: string; mime_type?: string; size_bytes?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const object_path = typeof body.object_path === "string" ? body.object_path.trim() : "";
  if (!object_path) return NextResponse.json({ error: "object_path required" }, { status: 400 });
  const supabase = await createClient();
  const { ok, error } = await finalizeUploadSession(supabase, ctx, sessionId, {
    object_path,
    mime_type: typeof body.mime_type === "string" ? body.mime_type : undefined,
    size_bytes: typeof body.size_bytes === "number" ? body.size_bytes : undefined,
  });
  if (!ok) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
