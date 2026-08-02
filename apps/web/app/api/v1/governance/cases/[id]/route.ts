/**
 * GET/PATCH /api/v1/governance/cases/:id
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getGovernanceCase, updateGovernanceCase } from "@/lib/domain/governance/governance.service";
import type {
  GovernanceCaseStatus,
  GovernanceSeverity,
  UpdateGovernanceCaseInput,
} from "@/lib/domain/governance/governance.types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getGovernanceCase(supabase, ctx, id);
  if (error) {
    const statusCode = error === "Insufficient rights" ? 403 : error === "Not found" ? 404 : 400;
    return NextResponse.json({ error }, { status: statusCode });
  }
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const patch: UpdateGovernanceCaseInput = {};
  if (typeof b.title === "string") patch.title = b.title;
  if (b.rationale === null || typeof b.rationale === "string") patch.rationale = b.rationale;
  if (b.severity === "medium" || b.severity === "high" || b.severity === "critical") {
    patch.severity = b.severity as GovernanceSeverity;
  }
  if (typeof b.decision_required === "string") patch.decision_required = b.decision_required;
  if (b.decision_outcome === null || typeof b.decision_outcome === "string") patch.decision_outcome = b.decision_outcome;
  if (b.owned_by === null || typeof b.owned_by === "string") patch.owned_by = b.owned_by;
  if (
    b.status === "open" ||
    b.status === "under_review" ||
    b.status === "decision_required" ||
    b.status === "decided" ||
    b.status === "resolved" ||
    b.status === "archived"
  ) {
    patch.status = b.status as GovernanceCaseStatus;
  }
  if (Array.isArray(b.project_ids)) {
    patch.project_ids = b.project_ids.filter((x): x is string => typeof x === "string");
  }
  if (b.project_notes && typeof b.project_notes === "object" && b.project_notes !== null) {
    patch.project_notes = b.project_notes as Record<string, string | undefined>;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await updateGovernanceCase(supabase, ctx, id, patch);
  if (error) {
    const statusCode =
      error === "Insufficient rights"
        ? 403
        : error === "Not found"
          ? 404
          : error.startsWith("Invalid")
            ? 400
            : 400;
    return NextResponse.json({ error }, { status: statusCode });
  }
  return NextResponse.json({ data });
}
