import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getIssueById, updateWorkerReportedIssue } from "@/lib/domain/issues/issue.service";
import type { IssueStatus, UpdateIssueInput } from "@/lib/domain/issues/issue.types";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const PATCH_KEY = "PATCH /api/v1/worker/issues/:issueId";
const WORKER_PATCH_STATUSES: IssueStatus[] = ["open", "in_review"];

/** GET /api/v1/worker/issues/:issueId?project_id= — worker reads one issue (inbox deep-link). */
export async function GET(
  request: Request,
  context: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await context.params;
  if (!issueId) return NextResponse.json({ error: "Missing issue id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  const projectId = new URL(request.url).searchParams.get("project_id")?.trim() ?? "";
  const supabase = await createClientFromRequest(request);
  const existing = await getIssueById(supabase, ctx, issueId);
  if (existing.error) return NextResponse.json({ error: existing.error }, { status: 403 });
  if (!existing.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (projectId && existing.data.project_id !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: existing.data });
}

/** PATCH /api/v1/worker/issues/:issueId?project_id= — worker resolution / comment. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await context.params;
  if (!issueId) return NextResponse.json({ error: "Missing issue id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, PATCH_KEY);
  if (!guard.ok) return guard.response;

  const projectId = new URL(request.url).searchParams.get("project_id")?.trim() ?? "";
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const existing = await getIssueById(supabase, ctx, issueId);
  if (existing.error) return NextResponse.json({ error: existing.error }, { status: 403 });
  if (!existing.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (projectId && existing.data.project_id !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const input: UpdateIssueInput = {};
  if (typeof body.description === "string") input.description = body.description;
  if (typeof body.status === "string") {
    if (!WORKER_PATCH_STATUSES.includes(body.status as IssueStatus)) {
      return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
    }
    input.status = body.status as IssueStatus;
  }
  if (typeof body.evidence_upload_session_id === "string" && body.evidence_upload_session_id.trim()) {
    input.evidence_upload_session_id = body.evidence_upload_session_id.trim();
  }

  const { data, error } = await updateWorkerReportedIssue(supabase, ctx, issueId, input);
  if (error) {
    const status = error === "Issue is closed" ? 409 : error === "Invalid evidence" ? 400 : 403;
    return NextResponse.json({ error }, { status });
  }
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  await storeLiteIdempotency(request, ctx, PATCH_KEY, { data }, 200);
  return NextResponse.json({ data });
}
