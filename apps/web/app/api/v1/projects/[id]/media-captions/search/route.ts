/**
 * GET /api/v1/projects/:id/media-captions/search?q=
 * AIS-MEM-016 lexical baseline search over caption/transcript segments.
 * Contractor-internal. Never portal. Does not imply work completion.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";
import { searchMediaCaptionSegments } from "@/lib/domain/media-captions/media-caption-index.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.message.includes("membership") ? 403 : 401 }
      );
    }
    throw e;
  }
  if (!canReadTasks(ctx) || ctx.role === "viewer" || ctx.role === "stakeholder") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 20;

  const supabase = await createClientFromRequest(request);
  const membership = await supabase.rpc("is_internal_tenant_writer_for_tenant", {
    p_tenant_id: ctx.tenantId!,
  });
  if (membership.error) {
    return NextResponse.json({ error: membership.error.message }, { status: 500 });
  }
  if (membership.data !== true) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const project = await getProjectRow(supabase, projectId, ctx.tenantId!);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await searchMediaCaptionSegments(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    query: q,
    limit: Number.isFinite(limit) ? limit : 20,
  });
  if (!result.ok) {
    const http = result.code === "INVALID_INPUT" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }
  return NextResponse.json({ data: { hits: result.hits, mode: "lexical" } });
}
