/**
 * POST /api/v1/projects/:id/field-daily-logs/:logId/confirm — human confirm gate.
 * AI must never call this automatically; attribution recorded on confirm.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { confirmFieldDailyLog } from "@/lib/domain/field-daily-log/field-daily-log.service";

export const dynamic = "force-dynamic";

function statusForError(error: string): number {
  if (error === "Not found" || error === "Project not found") return 404;
  if (error === "Insufficient rights" || error === "Portal access not allowed") return 403;
  if (error === "Tenant required") return 401;
  if (error.startsWith("Only draft")) return 409;
  return 400;
}

export async function POST(
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
  const { data, error } = await confirmFieldDailyLog(supabase, ctx, projectId, logId);
  if (error) return NextResponse.json({ error }, { status: statusForError(error) });
  if (!data) return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  return NextResponse.json({ data });
}
