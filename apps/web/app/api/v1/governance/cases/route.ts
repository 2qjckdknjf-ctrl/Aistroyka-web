/**
 * GET/POST /api/v1/governance/cases — cross-project governance cases (internal workspace).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import {
  createGovernanceCase,
  listGovernanceCasesForTenant,
} from "@/lib/domain/governance/governance.service";
import type { GovernanceCaseStatus, GovernanceSeverity } from "@/lib/domain/governance/governance.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const severityParam = url.searchParams.get("severity") as GovernanceSeverity | null;

  let status: GovernanceCaseStatus | GovernanceCaseStatus[] | undefined;
  if (statusParam) {
    const parts = statusParam.split(",").map((s) => s.trim()) as GovernanceCaseStatus[];
    status = parts.length > 1 ? parts : (parts[0] as GovernanceCaseStatus);
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listGovernanceCasesForTenant(supabase, ctx, {
    status,
    severity: severityParam ?? undefined,
    limit: 80,
  });
  if (error) {
    const statusCode = error === "Insufficient rights" ? 403 : 400;
    return NextResponse.json({ error }, { status: statusCode });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
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
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const decision_required = typeof b.decision_required === "string" ? b.decision_required.trim() : "";
  const severity = b.severity === "medium" || b.severity === "high" || b.severity === "critical" ? b.severity : null;
  const project_ids = Array.isArray(b.project_ids) ? b.project_ids.filter((x): x is string => typeof x === "string") : [];

  if (!title || !decision_required || !severity || project_ids.length === 0) {
    return NextResponse.json(
      { error: "title, decision_required, severity, and project_ids (non-empty) are required" },
      { status: 400 }
    );
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createGovernanceCase(supabase, ctx, {
    title,
    rationale: typeof b.rationale === "string" ? b.rationale : null,
    severity,
    decision_required,
    owned_by: typeof b.owned_by === "string" ? b.owned_by : null,
    project_ids,
    project_notes:
      b.project_notes && typeof b.project_notes === "object" && b.project_notes !== null
        ? (b.project_notes as Record<string, string | undefined>)
        : undefined,
  });

  if (error) {
    const statusCode =
      error === "Insufficient rights" ? 403 : error.includes("Invalid") || error.includes("required") ? 400 : 500;
    return NextResponse.json({ error }, { status: statusCode });
  }
  return NextResponse.json({ data }, { status: 201 });
}
