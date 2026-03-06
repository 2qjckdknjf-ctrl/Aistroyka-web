/**
 * PATCH /api/v1/media/:mediaId/annotations/:id — update annotation. Requires If-Match: version. 409 if version mismatch.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { emitChange } from "@/lib/sync/change-log.repository";

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
  if (expectedVersion == null) return NextResponse.json({ error: "If-Match version required" }, { status: 400 });
  const { mediaId, id } = await params;
  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("photo_annotations")
    .select("id, version")
    .eq("tenant_id", ctx.tenantId)
    .eq("media_id", mediaId)
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const currentVersion = (existing as { version: number }).version;
  if (currentVersion !== expectedVersion) {
    return NextResponse.json(
      { error: "Conflict", current_version: currentVersion, current_state: existing },
      { status: 409 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type.trim() : undefined;
  const data = body.data && typeof body.data === "object" ? body.data : undefined;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString(), version: currentVersion + 1 };
  if (type !== undefined) update.type = type;
  if (data !== undefined) update.data = data;
  const { data: updated, error } = await supabase
    .from("photo_annotations")
    .update(update)
    .eq("tenant_id", ctx.tenantId)
    .eq("media_id", mediaId)
    .eq("id", id)
    .eq("version", expectedVersion)
    .select("id, type, data, version, updated_at")
    .single();
  if (error) {
    if (error.code === "PGRST116") return NextResponse.json({ error: "Conflict", detail: "Annotation was modified since If-Match" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const admin = (await import("@/lib/supabase/admin")).getAdminClient();
  if (admin) await emitChange(admin, { tenant_id: ctx.tenantId, resource_type: "media", resource_id: mediaId, change_type: "updated", changed_by: ctx.userId, payload: { annotation_id: id } });
  return NextResponse.json({ data: updated });
}
