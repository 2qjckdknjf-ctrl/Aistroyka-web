/**
 * GET /api/v1/projects/:id/review-pack
 * Wave 4 Step 18 — project executive review pack (read model).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { buildProjectReviewPack } from "@/lib/domain/review-packs/project-review-pack.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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

  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProjectForInternalWorkspace(supabase, ctx, id);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const data = await buildProjectReviewPack(supabase, ctx.tenantId, { id: project.id, name: project.name }, ctx.userId);
  return NextResponse.json({ data });
}
