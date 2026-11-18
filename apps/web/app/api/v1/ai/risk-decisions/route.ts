/**
 * GET /api/v1/ai/risk-decisions — list manager AI risk decisions (audit_logs).
 * POST /api/v1/ai/risk-decisions — persist accept/assign/reject for an AI job.
 * Contractor-internal only. Does not write customer decision-requests or budget fields.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import { emitAudit, listAuditLogsByAction, type AuditLogRow } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

const ACTION = "ai_risk_decision";
const DECISIONS = ["accept", "assign", "reject"] as const;
type RiskDecision = (typeof DECISIONS)[number];

function parseDecision(value: unknown): RiskDecision | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "accept" || normalized === "assign" || normalized === "reject") {
    return normalized;
  }
  return undefined;
}

function present(row: AuditLogRow) {
  const details = row.details ?? {};
  return {
    id: row.id,
    job_id: row.resource_id,
    decision: typeof details.decision === "string" ? details.decision : null,
    comment: typeof details.comment === "string" ? details.comment : null,
    title: typeof details.title === "string" ? details.title : null,
    actor: row.user_id,
    created_at: row.created_at,
  };
}

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!canManageTasks(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const url = new URL(request.url);
  const jobId = url.searchParams.get("job_id") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const supabase = await createClientFromRequest(request);
  const rows = await listAuditLogsByAction(supabase, ctx.tenantId!, ACTION, {
    resourceId: jobId,
    limit,
  });
  return NextResponse.json({ data: rows.map(present) });
}

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
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

  const jobId = typeof body.job_id === "string" ? body.job_id.trim() : "";
  const decision = parseDecision(body.decision);
  if (!jobId) return NextResponse.json({ error: "job_id required" }, { status: 400 });
  if (!decision) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";

  const supabase = await createClientFromRequest(request);
  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: ACTION,
    resource_type: "ai_job",
    resource_id: jobId,
    details: {
      decision,
      comment: comment || null,
      title: title || null,
      source: "manager",
    },
  });

  return NextResponse.json(
    {
      data: {
        job_id: jobId,
        decision,
        comment: comment || null,
        title: title || null,
        actor: ctx.userId,
      },
    },
    { status: 201 }
  );
}
