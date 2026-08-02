/**
 * GET /api/v1/projects/:id/attention — derived attention queue for project.
 * Query: viewer=manager|owner (default manager).
 * viewer=owner requires project owner (project_members.role=owner).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { requireProjectOwner, requireProjectAccess, ProjectAccessError } from "@/lib/domain/projects/project-access";
import { getProjectAttentionSummary } from "@/lib/domain/projects/project-attention.repository";
import type { AttentionViewerRole } from "@/lib/domain/projects/project-attention.types";

export const dynamic = "force-dynamic";

const VALID_VIEWERS: AttentionViewerRole[] = ["manager", "owner"];

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
  const viewerParam = url.searchParams.get("viewer")?.trim().toLowerCase();
  const viewer: AttentionViewerRole =
    viewerParam && VALID_VIEWERS.includes(viewerParam as AttentionViewerRole)
      ? (viewerParam as AttentionViewerRole)
      : "manager";

  const supabase = await createClientFromRequest(request);
  try {
    if (viewer === "owner") {
      await requireProjectOwner(supabase, ctx, projectId);
    } else {
      await requireProjectAccess(supabase, ctx, projectId);
    }
  } catch (e) {
    if (e instanceof ProjectAccessError) {
      if (e.code === "forbidden") return NextResponse.json({ error: e.message }, { status: 403 });
      if (e.code === "tenant_required") return NextResponse.json({ error: e.message }, { status: 401 });
      if (e.code === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }

  const summary = await getProjectAttentionSummary(
    supabase,
    projectId,
    ctx.tenantId!,
    viewer
  );

  return NextResponse.json({ data: summary });
}
