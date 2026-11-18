import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createWorkerReportedIssue, listIssues } from "@/lib/domain/issues/issue.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const CREATE_KEY = "POST /api/v1/worker/issues";

function projectIdFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("project_id")?.trim() ?? "";
  if (fromQuery) return fromQuery;
  const fromBody = typeof body?.project_id === "string" ? body.project_id.trim() : "";
  return fromBody;
}

/** GET /api/v1/worker/issues?project_id=&status= — worker-scoped issue list. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const projectId = projectIdFrom(request);
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });
  const status = new URL(request.url).searchParams.get("status")?.trim() || undefined;
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listIssues(supabase, ctx, projectId, { status });
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

/** POST /api/v1/worker/issues — create an issue the manager can see. */
export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, CREATE_KEY);
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const projectId = projectIdFrom(request, body);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const evidenceSession =
    typeof body.evidence_upload_session_id === "string" ? body.evidence_upload_session_id.trim() : "";

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createWorkerReportedIssue(supabase, ctx, {
    project_id: projectId,
    title,
    description: typeof body.description === "string" ? body.description : undefined,
    task_id: typeof body.task_id === "string" ? body.task_id : undefined,
    evidence_upload_session_id: evidenceSession || undefined,
  });
  if (error === "Invalid issue evidence") return NextResponse.json({ error }, { status: 400 });
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });
  await storeLiteIdempotency(request, ctx, CREATE_KEY, { data }, 201);
  return NextResponse.json({ data }, { status: 201 });
}
