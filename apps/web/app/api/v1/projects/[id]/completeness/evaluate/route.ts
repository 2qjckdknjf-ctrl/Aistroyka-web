/**
 * POST /api/v1/projects/:id/completeness/evaluate
 * AIS-RULE-015: evaluate evidence inventory against one approved trade template.
 * Contractor-internal. Never portal. Never claims workmanship PASS.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import { emitAudit } from "@/lib/observability/audit.service";
import {
  parseEvidenceInventory,
  persistTradeCompletenessEvaluation,
  runTradeCompletenessEvaluation,
} from "@/lib/domain/construction-rules/trade-completeness.service";

export const dynamic = "force-dynamic";

export async function POST(
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
  if (!canManageTasks(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  if (!ctx.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const templateId =
    typeof body.template_id === "string"
      ? body.template_id
      : typeof body.templateId === "string"
        ? body.templateId
        : "trade.waterproofing.wet_area";
  const inventory = parseEvidenceInventory(body.inventory ?? body.evidence);
  if (!inventory) {
    return NextResponse.json(
      { error: "inventory must be an array", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const evaluated = runTradeCompletenessEvaluation(templateId, inventory);
  if (!evaluated.ok) {
    return NextResponse.json(
      { error: evaluated.error, code: evaluated.code },
      { status: evaluated.code === "TEMPLATE_NOT_FOUND" ? 404 : 400 }
    );
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

  const persist = await persistTradeCompletenessEvaluation(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    actorUserId: ctx.userId,
    evaluation: evaluated.evaluation,
    inventory,
  });
  if (!persist.ok) {
    return NextResponse.json(
      { error: persist.error, code: persist.code },
      { status: 500 }
    );
  }

  void emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId ?? null,
    action: "construction_completeness_evaluated",
    resource_type: "construction_completeness_evaluation",
    resource_id: persist.id,
    details: {
      project_id: projectId,
      template_id: evaluated.evaluation.templateId,
      template_version: evaluated.evaluation.templateVersion,
      verdict: evaluated.evaluation.verdict,
      missing_required_count: evaluated.evaluation.missingRequiredCount,
      missing_recommended_count: evaluated.evaluation.missingRecommendedCount,
    },
  });

  return NextResponse.json({
    data: {
      evaluation_id: persist.id,
      evaluation: evaluated.evaluation,
    },
  });
}
