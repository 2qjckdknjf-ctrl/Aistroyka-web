import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireProjectOwner, ProjectAccessError } from "@/lib/domain/projects/project-access";
import type { OwnerDecisionAction } from "@/lib/domain/documents/document.types";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: OwnerDecisionAction[] = ["approve", "reject", "request_changes"];
const MAX_BULK_DECISION_ITEMS = 20;

type BulkDecisionFailure = {
  document_id: string;
  error: string;
};

type BulkDecisionRpcRow = {
  document_id: string;
  ok: boolean;
  error: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** POST /api/v1/projects/:id/documents/decisions — owner bulk decision. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  try {
    await requireProjectOwner(supabase, ctx, projectId);
  } catch (e) {
    if (e instanceof ProjectAccessError) {
      if (e.code === "forbidden") return NextResponse.json({ error: e.message }, { status: 403 });
      if (e.code === "tenant_required") return NextResponse.json({ error: e.message }, { status: 401 });
      if (e.code === "not_found") return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action =
    typeof body.action === "string" && VALID_ACTIONS.includes(body.action as OwnerDecisionAction)
      ? (body.action as OwnerDecisionAction)
      : null;
  if (!action) {
    return NextResponse.json(
      { error: "action required: approve | reject | request_changes" },
      { status: 400 }
    );
  }

  const comment = typeof body.comment === "string" ? body.comment : undefined;

  const rawIds = Array.isArray(body.document_ids)
    ? body.document_ids.filter((item): item is string => typeof item === "string")
    : [];

  const uniqueIds = Array.from(
    new Set(rawIds.map((id) => id.trim()).filter((id) => id.length > 0))
  );

  if (uniqueIds.length === 0) {
    return NextResponse.json({ error: "document_ids required" }, { status: 400 });
  }

  if (uniqueIds.length > MAX_BULK_DECISION_ITEMS) {
    return NextResponse.json(
      { error: `bulk decision limit is ${MAX_BULK_DECISION_ITEMS}` },
      { status: 400 }
    );
  }

  if (!uniqueIds.every((id) => UUID_RE.test(id))) {
    return NextResponse.json({ error: "document_ids must be valid uuid values" }, { status: 400 });
  }
  if (!ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("owner_bulk_decide_documents", {
    p_project_id: projectId,
    p_tenant_id: ctx.tenantId,
    p_action: action,
    p_document_ids: uniqueIds,
    p_comment: comment ?? null,
  });

  if (error) {
    const message = (error.message ?? "bulk decision failed").toLowerCase();
    if (message.includes("forbidden")) {
      return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
    }
    if (message.includes("not authenticated")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message.includes("batch_conflict")) {
      return NextResponse.json({ error: "Selection changed. Reload and retry." }, { status: 409 });
    }
    return NextResponse.json({ error: "bulk decision failed" }, { status: 500 });
  }

  const rows = (data ?? []) as BulkDecisionRpcRow[];
  const failed: BulkDecisionFailure[] = rows
    .filter((row) => !row.ok || !!row.error)
    .map((row) => ({
      document_id: row.document_id,
      error: row.error ?? "decision_failed",
    }));
  const failedIds = new Set(failed.map((row) => row.document_id));
  const succeeded = uniqueIds.filter((id) => !failedIds.has(id));

  return NextResponse.json({
    data: {
      action,
      total: uniqueIds.length,
      succeeded_count: succeeded.length,
      failed_count: failed.length,
      succeeded_ids: succeeded,
      failed,
    },
  });
}
