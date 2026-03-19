/**
 * GET /api/v1/projects/:id/estimate — project estimate summary (budget + estimate results + source documents).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { getProjectEstimateSummary } from "@/lib/domain/estimate/estimate.service";

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
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const project = await getProjectById(supabase, projectId, ctx.tenantId!);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const summary = await getProjectEstimateSummary(supabase, {
    projectId,
    tenantId: ctx.tenantId!,
  });

  return NextResponse.json({ data: summary });
}
