/**
 * POST /api/v1/reconciliation/findings/:id/review
 * Human accept/reject for AIS-RECON-017 findings. Does not mutate estimates.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import { emitAudit } from "@/lib/observability/audit.service";
import {
  parseReconciliationFindingStatus,
  reviewReconciliationFinding,
} from "@/lib/domain/tender-reconciliation/finding-ledger.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: findingId } = await context.params;
  if (!findingId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  if (!canManageTasks(ctx) || !ctx.userId) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = parseReconciliationFindingStatus(body.status ?? body.verdict);
  if (!status) {
    return NextResponse.json(
      { error: "status must be accepted or rejected" },
      { status: 400 }
    );
  }
  const note =
    typeof body.note === "string"
      ? body.note
      : typeof body.comment === "string"
        ? body.comment
        : null;

  const supabase = await createClientFromRequest(request);
  const result = await reviewReconciliationFinding(supabase, {
    tenantId: ctx.tenantId!,
    findingId,
    reviewerUserId: ctx.userId,
    status,
    note,
  });
  if (!result.ok) {
    const http =
      result.code === "NOT_FOUND" ? 404 : result.code === "INVALID_INPUT" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  void emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "tender_reconciliation_finding_reviewed",
    resource_type: "tender_reconciliation_finding",
    resource_id: result.finding.id,
    details: {
      status: result.finding.status,
      kind: result.finding.kind,
      project_id: result.finding.project_id,
    },
  });

  return NextResponse.json({ data: result.finding });
}
