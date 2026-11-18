/**
 * GET /api/v1/projects/:id/intake-drafts
 * AIS-CLIENT-005A: contractor-internal intake picker for preproject extraction.
 * Returns id/title/description/status only — never budget_range or costs.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";
import { listProjectIntakeDraftsForExtraction } from "@/lib/domain/preproject-extraction/intake-draft-binding";

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

  const listed = await listProjectIntakeDraftsForExtraction(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
  });
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error, code: listed.code }, { status: 500 });
  }

  // Defense-in-depth: never leak commercial keys even if select drifts.
  const drafts = listed.drafts.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    status: d.status,
    project_id: d.project_id,
    updated_at: d.updated_at,
  }));

  return NextResponse.json({ data: { drafts } });
}
