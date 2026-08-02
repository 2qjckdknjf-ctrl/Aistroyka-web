/**
 * POST /api/v1/projects/:id/defects/:defectId/transition
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { transitionDefect } from "@/lib/domain/defects/defects.service";
import type { DefectStatus } from "@/lib/domain/defects/defects.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; defectId: string }> }) {
  const { id: projectId, defectId } = await context.params;
  if (!projectId || !defectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
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

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toStatus = body.to_status as DefectStatus;
  const note = typeof body.note === "string" ? body.note : null;
  const resolution_note = typeof body.resolution_note === "string" ? body.resolution_note : null;

  const supabase = await createClientFromRequest(request);
  const { ok, error } = await transitionDefect(supabase, ctx, projectId, defectId, toStatus, note, resolution_note);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error: error || "Transition failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
