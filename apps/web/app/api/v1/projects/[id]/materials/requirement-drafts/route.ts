/**
 * GET /api/v1/projects/:id/materials/requirement-drafts
 * AIS-MATERIAL-008: list material need drafts for a project.
 * Contractor-internal read. No order/pay/supplier message. No prices in this list.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";
import { listMaterialRequirementDrafts } from "@/lib/domain/materials/material-requirement-draft.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

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

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 50;

  const listed = await listMaterialRequirementDrafts(
    supabase,
    ctx.tenantId!,
    projectId,
    Number.isFinite(limit) ? limit : 50
  );
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error, code: listed.code }, { status: 500 });
  }

  return NextResponse.json({ data: { drafts: listed.drafts } });
}
