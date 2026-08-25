/**
 * POST /api/v1/ai/governed-actions/execute — governed pilot AI action execution.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { executeGovernedAiAction } from "@/lib/ai-governance/pilot/action-executor.service";
import { listPilotActions } from "@/lib/ai-governance/pilot/action-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: { actions: listPilotActions() } });
}

export async function POST(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action_id?: string;
    project_id?: string;
    dry_run?: boolean;
    idempotency_key?: string;
    input?: Record<string, unknown>;
    source_refs?: Array<{ type: string; id: string }>;
  };

  const actionId = body.action_id;
  const projectId = body.project_id;
  if (!actionId || !projectId) {
    return NextResponse.json({ error: "action_id and project_id required" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const result = await executeGovernedAiAction(supabase, {
    actionId,
    tenantId: ctx.tenantId!,
    projectId,
    initiatedBy: ctx.userId!,
    userRole: ctx.role ?? "member",
    dryRun: body.dry_run === true,
    idempotencyKey: body.idempotency_key ?? null,
    input: body.input ?? {},
    sourceRefs: body.source_refs ?? [],
  });

  const status = result.status === "blocked" ? 403 : 200;
  return NextResponse.json({ data: result }, { status });
}
