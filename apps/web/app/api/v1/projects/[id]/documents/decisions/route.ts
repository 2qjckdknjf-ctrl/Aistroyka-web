import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireProjectOwner, ProjectAccessError } from "@/lib/domain/projects/project-access";
import { performOwnerDecision } from "@/lib/domain/documents/document-decision.service";
import type { OwnerDecisionAction } from "@/lib/domain/documents/document.types";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: OwnerDecisionAction[] = ["approve", "reject", "request_changes"];
const MAX_BULK_DECISION_ITEMS = 20;

type BulkDecisionFailure = {
  document_id: string;
  error: string;
};

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

  const succeeded: string[] = [];
  const failed: BulkDecisionFailure[] = [];

  for (const documentId of uniqueIds) {
    const { error } = await performOwnerDecision(
      supabase,
      ctx,
      documentId,
      projectId,
      action,
      comment
    );
    if (error) {
      failed.push({ document_id: documentId, error });
      continue;
    }
    succeeded.push(documentId);
  }

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
