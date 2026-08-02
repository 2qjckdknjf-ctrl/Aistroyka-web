/**
 * DELETE /api/v1/projects/:id/proof-pack/shares/:token — revoke a proof pack share link.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { revokeProofPackShare } from "@/lib/domain/proof-pack/proof-pack.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; token: string }> }
) {
  const { id: projectId, token } = await context.params;
  if (!projectId || !token) return NextResponse.json({ error: "Missing id or token" }, { status: 400 });
  const ctx = await getTenantContextFromRequest(request);
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
  const { ok, error } = await revokeProofPackShare(supabase, ctx, projectId, token);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
