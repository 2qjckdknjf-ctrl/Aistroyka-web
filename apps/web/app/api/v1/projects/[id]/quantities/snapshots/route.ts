/**
 * POST/GET /api/v1/projects/:id/quantities/snapshots
 * Stage2a A01 immutable InputSnapshot storage + optional C04 calculation revision.
 * Contractor-internal only. Never a customer/portal/owner finance surface.
 * No unit prices, margin, or commercial totals are accepted or returned.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";
import {
  getProjectQuantitySnapshot,
  listProjectQuantitySnapshots,
  persistQuantitySnapshot,
} from "@/lib/domain/quantities/quantity-storage.service";
import { canWriteQuantitySnapshot } from "@/lib/domain/quantities/quantity-write-policy";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

async function canAccessQuantityStorage(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  tenantId: string,
  projectId: string
): Promise<{ ok: boolean; error: string }> {
  // Internal writers only — stakeholders/viewers/portal excluded at RLS and here.
  const membership = await supabase.rpc("is_internal_tenant_writer_for_tenant", {
    p_tenant_id: tenantId,
  });
  if (membership.error) return { ok: false, error: membership.error.message };
  if (membership.data !== true) return { ok: false, error: "" };

  const project = await getProjectRow(supabase, projectId, tenantId);
  if (!project) return { ok: false, error: "not_found" };
  return { ok: true, error: "" };
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

  // A01 read: contractor internal writers only (owner/admin/member). Viewer/stakeholder fail closed.
  if (!canReadTasks(ctx) || ctx.role === "viewer" || ctx.role === "stakeholder") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const access = await canAccessQuantityStorage(supabase, ctx.tenantId!, projectId);
  if (access.error === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access.error) return NextResponse.json({ error: access.error }, { status: 500 });
  if (!access.ok) return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });

  const url = new URL(request.url);
  const snapshotId = url.searchParams.get("snapshot_id");
  if (snapshotId) {
    const one = await getProjectQuantitySnapshot(
      supabase,
      ctx.tenantId!,
      projectId,
      snapshotId
    );
    if (!one.ok) {
      const http = one.code === "NOT_FOUND" ? 404 : 500;
      return NextResponse.json({ error: one.error, code: one.code }, { status: http });
    }
    return NextResponse.json({
      data: {
        snapshot: one.snapshot,
        calculation: one.calculation
          ? {
              id: one.calculation.id,
              revision: one.calculation.revision,
              quantity: one.calculation.quantity,
              unit: one.calculation.unit,
              quantity_basis: one.calculation.quantity_basis,
              rule_id: one.calculation.rule_id,
              rule_version: one.calculation.rule_version,
              issues: one.calculation.issues,
              created_at: one.calculation.created_at,
            }
          : null,
      },
    });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 50;
  const listed = await listProjectQuantitySnapshots(
    supabase,
    ctx.tenantId!,
    projectId,
    Number.isFinite(limit) ? limit : 50
  );
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error, code: listed.code }, { status: 500 });
  }
  return NextResponse.json({ data: { snapshots: listed.snapshots } });
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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept { request }, { input }, or a bare QuantityRequest ({ kind }).
  const quantityRequest =
    body.request !== undefined
      ? body.request
      : body.input !== undefined
        ? body.input
        : typeof body.kind === "string"
          ? body
          : null;

  if (quantityRequest == null) {
    return NextResponse.json(
      { error: "request QuantityRequest required" },
      { status: 400 }
    );
  }

  const quantityKind =
    quantityRequest !== null &&
    typeof quantityRequest === "object" &&
    !Array.isArray(quantityRequest) &&
    "quantity_kind" in quantityRequest
      ? (quantityRequest as { quantity_kind?: unknown }).quantity_kind
      : undefined;

  // A03: managers any kind; members only reported/measured field captures.
  const writeAccess = canWriteQuantitySnapshot(ctx, quantityKind);
  if (!writeAccess.ok) {
    return NextResponse.json({ error: writeAccess.error }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const access = await canAccessQuantityStorage(supabase, ctx.tenantId!, projectId);
  if (access.error === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access.error) return NextResponse.json({ error: access.error }, { status: 500 });
  if (!access.ok) return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });

  const result = await persistQuantitySnapshot(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    actorUserId: ctx.userId!,
    request: quantityRequest,
    evidenceRefs: body.evidence_refs ?? body.evidenceRefs,
    workSpecificationTitle:
      typeof body.title === "string"
        ? body.title
        : typeof body.work_specification_title === "string"
          ? body.work_specification_title
          : undefined,
    compute: body.compute !== false && body.compute !== "false",
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT" || result.code === "COMMERCIAL_FORBIDDEN"
        ? 400
        : result.code === "UNSUPPORTED_RULE"
          ? 422
          : result.code === "CONFLICT"
            ? 409
            : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: result.created
      ? "quantity_input_snapshot_created"
      : "quantity_input_snapshot_reused",
    resource_type: "quantity_input_snapshot",
    resource_id: result.snapshot.id,
    details: {
      project_id: projectId,
      work_code: result.snapshot.work_code,
      request_hash: result.snapshot.request_hash,
      work_specification_id: result.work_specification_id,
      calculation_id: result.calculation?.id ?? null,
      quantity: result.calculation?.quantity ?? null,
      unit: result.calculation?.unit ?? null,
      issues: result.calculation?.issues ?? [],
      source: ctx.role === "member" ? "worker" : "manager",
      quantity_kind: quantityKind ?? null,
    },
  });

  return NextResponse.json(
    {
      data: {
        snapshot: result.snapshot,
        created: result.created,
        work_specification_id: result.work_specification_id,
        calculation: result.calculation
          ? {
              id: result.calculation.id,
              revision: result.calculation.revision,
              quantity: result.calculation.quantity,
              unit: result.calculation.unit,
              quantity_basis: result.calculation.quantity_basis,
              rule_id: result.calculation.rule_id,
              rule_version: result.calculation.rule_version,
              issues: result.calculation.issues,
              created_at: result.calculation.created_at,
            }
          : null,
      },
    },
    { status: result.created ? 201 : 200 }
  );
}
