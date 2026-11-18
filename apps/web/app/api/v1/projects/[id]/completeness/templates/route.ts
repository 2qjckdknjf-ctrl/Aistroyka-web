/**
 * GET /api/v1/projects/:id/completeness/templates
 * AIS-RULE-015: list approved trade completeness templates (contractor-internal).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";
import { listTradeCompletenessTemplates } from "@/lib/domain/construction-rules/trade-completeness.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(_request);
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

  const supabase = await createClientFromRequest(_request);
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

  return NextResponse.json({ data: { templates: listTradeCompletenessTemplates() } });
}
