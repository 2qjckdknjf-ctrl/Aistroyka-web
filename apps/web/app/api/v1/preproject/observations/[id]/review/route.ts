/**
 * POST /api/v1/preproject/observations/:id/review
 * Manager/admin human verdict on a preproject observation.
 * Does not promote to Graph, estimates, or assignments.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import {
  parsePreprojectReviewStatus,
  reviewPreprojectObservation,
} from "@/lib/domain/preproject-extraction/preproject-extraction.service";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: observationId } = await context.params;
  if (!observationId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = parsePreprojectReviewStatus(body.status ?? body.verdict);
  if (!status) {
    return NextResponse.json(
      { error: "status must be accepted, rejected, or edited" },
      { status: 400 }
    );
  }

  const note =
    typeof body.note === "string"
      ? body.note
      : typeof body.comment === "string"
        ? body.comment
        : null;
  const editedLabel =
    typeof body.edited_label === "string"
      ? body.edited_label
      : typeof body.label === "string"
        ? body.label
        : null;

  const supabase = await createClientFromRequest(request);
  const result = await reviewPreprojectObservation(supabase, {
    tenantId: ctx.tenantId!,
    observationId,
    reviewerUserId: ctx.userId!,
    status,
    note,
    editedLabel,
  });

  if (!result.ok) {
    const http =
      result.code === "NOT_FOUND" ? 404 : result.code === "INVALID_INPUT" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "preproject_observation_reviewed",
    resource_type: "preproject_observation",
    resource_id: result.observation.id,
    details: {
      status: result.observation.review_status,
      run_id: result.observation.run_id,
      kind: result.observation.kind,
      source: "manager",
    },
  });

  return NextResponse.json({ data: result.observation });
}
