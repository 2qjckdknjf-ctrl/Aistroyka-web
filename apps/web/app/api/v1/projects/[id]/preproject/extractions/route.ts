/**
 * POST/GET /api/v1/projects/:id/preproject/extractions
 * AIS-CLIENT-005A first slice: heuristic text extraction → reviewable observations.
 * Contractor-internal. No auto estimates/contracts/assignments. No prices/margin.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canManageTasks } from "@/lib/domain/tasks/task.policy";
import {
  createHeuristicExtractionRun,
  listExtractionRunsForProject,
} from "@/lib/domain/preproject-extraction/preproject-extraction.service";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

async function requireInternalProject(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  tenantId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const membership = await supabase.rpc("is_internal_tenant_writer_for_tenant", {
    p_tenant_id: tenantId,
  });
  if (membership.error) return { ok: false, status: 500, error: membership.error.message };
  if (membership.data !== true) return { ok: false, status: 403, error: "Insufficient rights" };
  const project = await getProjectRow(supabase, projectId, tenantId);
  if (!project) return { ok: false, status: 404, error: "Not found" };
  return { ok: true };
}

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

  if (ctx.role === "viewer" || ctx.role === "stakeholder") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const access = await requireInternalProject(supabase, ctx.tenantId!, projectId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const listed = await listExtractionRunsForProject(supabase, ctx.tenantId!, projectId);
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error, code: listed.code }, { status: 500 });
  }
  return NextResponse.json({ data: { runs: listed.runs } });
}

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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text =
    typeof body.text === "string"
      ? body.text
      : typeof body.description === "string"
        ? body.description
        : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const intakeDraftId =
    typeof body.intake_draft_id === "string"
      ? body.intake_draft_id
      : typeof body.intakeDraftId === "string"
        ? body.intakeDraftId
        : null;

  const supabase = await createClientFromRequest(request);
  const access = await requireInternalProject(supabase, ctx.tenantId!, projectId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const result = await createHeuristicExtractionRun(supabase, {
    tenantId: ctx.tenantId!,
    actorUserId: ctx.userId!,
    projectId,
    intakeDraftId,
    text,
  });

  if (!result.ok) {
    const http =
      result.code === "DRAFT_NOT_FOUND" || result.code === "DRAFT_PROJECT_MISMATCH"
        ? 404
        : result.code === "DRAFT_WITHDRAWN" ||
            result.code === "INVALID_INPUT" ||
            result.code === "COMMERCIAL_FORBIDDEN"
          ? 400
          : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: result.reused
      ? "preproject_extraction_run_reused"
      : "preproject_extraction_run_created",
    resource_type: "preproject_extraction_run",
    resource_id: result.run.id,
    details: {
      project_id: projectId,
      intake_draft_id: intakeDraftId,
      source_kind: result.run.source_kind,
      observation_count: result.run.observations.length,
      reused: Boolean(result.reused),
      source: "manager_heuristic",
    },
  });

  return NextResponse.json(
    { data: { ...result.run, reused: Boolean(result.reused) } },
    { status: result.reused ? 200 : 201 }
  );
}
