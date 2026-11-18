/**
 * GET/POST /api/v1/projects/:id/reconciliation/findings
 * AIS-RECON-017 Finding Ledger. Contractor-internal. Never mutates estimates.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { canManageTasks, canReadTasks } from "@/lib/domain/tasks/task.policy";
import { emitAudit } from "@/lib/observability/audit.service";
import {
  createReconciliationFinding,
  listReconciliationFindings,
  parseReconciliationFindingKind,
} from "@/lib/domain/tender-reconciliation/finding-ledger.service";

export const dynamic = "force-dynamic";

async function gateProject(
  request: Request,
  projectId: string,
  mode: "read" | "write"
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return {
        error: NextResponse.json(
          { error: e.message },
          { status: e.message.includes("membership") ? 403 : 401 }
        ),
      };
    }
    throw e;
  }
  if (mode === "write" && !canManageTasks(ctx)) {
    return { error: NextResponse.json({ error: "Insufficient rights" }, { status: 403 }) };
  }
  if (mode === "read" && (!canReadTasks(ctx) || ctx.role === "viewer" || ctx.role === "stakeholder")) {
    return { error: NextResponse.json({ error: "Insufficient rights" }, { status: 403 }) };
  }
  if (!ctx.userId) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const supabase = await createClientFromRequest(request);
  const membership = await supabase.rpc("is_internal_tenant_writer_for_tenant", {
    p_tenant_id: ctx.tenantId!,
  });
  if (membership.error) {
    return { error: NextResponse.json({ error: membership.error.message }, { status: 500 }) };
  }
  if (membership.data !== true) {
    return { error: NextResponse.json({ error: "Insufficient rights" }, { status: 403 }) };
  }
  const project = await getProjectRow(supabase, projectId, ctx.tenantId!);
  if (!project) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { ctx, supabase };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const gated = await gateProject(request, projectId, "read");
  if ("error" in gated && gated.error) return gated.error;

  const listed = await listReconciliationFindings(
    gated.supabase!,
    gated.ctx!.tenantId!,
    projectId
  );
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error, code: listed.code }, { status: 500 });
  }
  return NextResponse.json({ data: { findings: listed.findings } });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const gated = await gateProject(request, projectId, "write");
  if ("error" in gated && gated.error) return gated.error;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = parseReconciliationFindingKind(body.kind);
  if (!kind) {
    return NextResponse.json({ error: "invalid kind", code: "INVALID_INPUT" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title : "";
  const summary = typeof body.summary === "string" ? body.summary : "";

  const result = await createReconciliationFinding(gated.supabase!, {
    tenantId: gated.ctx!.tenantId!,
    projectId,
    actorUserId: gated.ctx!.userId!,
    kind,
    title,
    summary,
    expectedQuantity:
      typeof body.expected_quantity === "number"
        ? body.expected_quantity
        : typeof body.expectedQuantity === "number"
          ? body.expectedQuantity
          : null,
    observedQuantity:
      typeof body.observed_quantity === "number"
        ? body.observed_quantity
        : typeof body.observedQuantity === "number"
          ? body.observedQuantity
          : null,
    unit: typeof body.unit === "string" ? body.unit : null,
    sourceDocumentRef:
      typeof body.source_document_ref === "string"
        ? body.source_document_ref
        : typeof body.sourceDocumentRef === "string"
          ? body.sourceDocumentRef
          : null,
    sourceRevision:
      typeof body.source_revision === "string"
        ? body.source_revision
        : typeof body.sourceRevision === "string"
          ? body.sourceRevision
          : null,
    estimateRef:
      typeof body.estimate_ref === "string"
        ? body.estimate_ref
        : typeof body.estimateRef === "string"
          ? body.estimateRef
          : null,
    measurementMethod:
      typeof body.measurement_method === "string"
        ? body.measurement_method
        : typeof body.measurementMethod === "string"
          ? body.measurementMethod
          : null,
    uncertainty: typeof body.uncertainty === "string" ? body.uncertainty : "unknown",
    details:
      body.details && typeof body.details === "object" && !Array.isArray(body.details)
        ? (body.details as Record<string, unknown>)
        : {},
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT" || result.code === "COMMERCIAL_FORBIDDEN" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  void emitAudit(gated.supabase!, {
    tenant_id: gated.ctx!.tenantId!,
    user_id: gated.ctx!.userId,
    action: "tender_reconciliation_finding_created",
    resource_type: "tender_reconciliation_finding",
    resource_id: result.finding.id,
    details: {
      project_id: projectId,
      kind: result.finding.kind,
      status: result.finding.status,
      has_estimate_ref: Boolean(result.finding.estimate_ref),
    },
  });

  return NextResponse.json({ data: result.finding }, { status: 201 });
}
