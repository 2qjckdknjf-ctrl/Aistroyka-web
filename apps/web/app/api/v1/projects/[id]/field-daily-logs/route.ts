/**
 * GET/POST /api/v1/projects/:id/field-daily-logs
 * Contractor-ops field daily log (draft create + list). Not Phase 7 digest.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import {
  createFieldDailyLogDraft,
  listFieldDailyLogs,
} from "@/lib/domain/field-daily-log/field-daily-log.service";

export const dynamic = "force-dynamic";

function statusForError(error: string): number {
  if (error === "Not found" || error === "Project not found") return 404;
  if (error === "Insufficient rights" || error === "Portal access not allowed") return 403;
  if (error === "Tenant required") return 401;
  if (
    error.includes("required") ||
    error.includes("YYYY-MM-DD") ||
    error.startsWith("Only draft")
  ) {
    return 400;
  }
  return 400;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const work_date = url.searchParams.get("work_date")?.trim() || undefined;
  const status = url.searchParams.get("status")?.trim() || undefined;
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw || 50 : 50, 100);

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listFieldDailyLogs(supabase, ctx, projectId, {
    work_date,
    status,
    limit,
  });
  if (error) return NextResponse.json({ error }, { status: statusForError(error) });
  return NextResponse.json({ data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const work_date = typeof body.work_date === "string" ? body.work_date.trim() : "";
  const media_refs = Array.isArray(body.media_refs)
    ? body.media_refs.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : undefined;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createFieldDailyLogDraft(supabase, ctx, {
    project_id: projectId,
    work_date,
    note: typeof body.note === "string" ? body.note : undefined,
    summary: typeof body.summary === "string" ? body.summary : undefined,
    work_done: typeof body.work_done === "string" ? body.work_done : undefined,
    blockers: typeof body.blockers === "string" ? body.blockers : undefined,
    weather: typeof body.weather === "string" ? body.weather : undefined,
    media_refs,
  });
  if (error) return NextResponse.json({ error }, { status: statusForError(error) });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
