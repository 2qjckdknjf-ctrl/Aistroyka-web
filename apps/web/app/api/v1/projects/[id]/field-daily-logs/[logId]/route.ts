/**
 * PATCH /api/v1/projects/:id/field-daily-logs/:logId — edit draft only.
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
  getFieldDailyLogById,
  updateFieldDailyLogDraft,
} from "@/lib/domain/field-daily-log/field-daily-log.service";
import type { UpdateFieldDailyLogDraftInput } from "@/lib/domain/field-daily-log/field-daily-log.types";

export const dynamic = "force-dynamic";

function statusForError(error: string): number {
  if (error === "Not found" || error === "Project not found") return 404;
  if (error === "Insufficient rights" || error === "Portal access not allowed") return 403;
  if (error === "Tenant required") return 401;
  if (error.startsWith("Only draft") || error.includes("required") || error.includes("YYYY-MM-DD")) {
    return 409;
  }
  return 400;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; logId: string }> }
) {
  const { id: projectId, logId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  if (!logId) return NextResponse.json({ error: "Missing log id" }, { status: 400 });

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

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getFieldDailyLogById(supabase, ctx, projectId, logId);
  if (error) return NextResponse.json({ error }, { status: statusForError(error) });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; logId: string }> }
) {
  const { id: projectId, logId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  if (!logId) return NextResponse.json({ error: "Missing log id" }, { status: 400 });

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

  const input: UpdateFieldDailyLogDraftInput = {};
  if (typeof body.work_date === "string") input.work_date = body.work_date.trim();
  if (typeof body.note === "string") input.note = body.note;
  if (typeof body.summary === "string") input.summary = body.summary;
  if (typeof body.work_done === "string") input.work_done = body.work_done;
  if (typeof body.blockers === "string") input.blockers = body.blockers;
  if (typeof body.weather === "string") input.weather = body.weather;
  if (Array.isArray(body.media_refs)) {
    input.media_refs = body.media_refs.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
  }

  const supabase = await createClientFromRequest(request);
  if (Object.keys(input).length === 0) {
    const { data, error } = await getFieldDailyLogById(supabase, ctx, projectId, logId);
    if (error) return NextResponse.json({ error }, { status: statusForError(error) });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  }

  const { data, error } = await updateFieldDailyLogDraft(supabase, ctx, projectId, logId, input);
  if (error) return NextResponse.json({ error }, { status: statusForError(error) });
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ data });
}
