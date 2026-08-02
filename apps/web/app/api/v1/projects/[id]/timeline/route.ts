/**
 * GET /api/v1/projects/:id/timeline — unified project activity feed.
 * Query: limit (default 30).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getProjectTimeline } from "@/lib/domain/projects/project-timeline.repository";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 30), 100) : 30;

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProjectForInternalWorkspace(supabase, ctx, projectId);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const items = await getProjectTimeline(
    supabase,
    projectId,
    ctx.tenantId!,
    limit
  );

  return NextResponse.json({ data: items });
}
