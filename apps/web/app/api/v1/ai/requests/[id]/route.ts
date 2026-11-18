import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  presentAIRequestRow,
  visionConfiguredForEnv,
} from "@/lib/platform/ai/ai-request-presentation";

export const dynamic = "force-dynamic";

const AI_JOB_TYPES = ["ai_analyze_media", "ai_analyze_report"];

/** GET /api/v1/ai/requests/:id — single AI job detail (tenant-scoped). */
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
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId!)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Failed to load AI request" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const r = row as { type: string; payload?: unknown };
  if (!AI_JOB_TYPES.includes(r.type)) return NextResponse.json({ error: "Not an AI request" }, { status: 404 });

  const presented = presentAIRequestRow(row as Parameters<typeof presentAIRequestRow>[0]);

  // Tenant detail: safe fields only. Do not echo raw payload paths/URLs that may include storage keys.
  const payload = (r.payload ?? {}) as Record<string, unknown>;
  const safePayload = {
    report_id: typeof payload.report_id === "string" ? payload.report_id : undefined,
    media_id: typeof payload.media_id === "string" ? payload.media_id : undefined,
    upload_session_id:
      typeof payload.upload_session_id === "string" ? payload.upload_session_id : undefined,
    project_id: typeof payload.project_id === "string" ? payload.project_id : undefined,
    // Intentionally omit image_url (may contain signed/storage URLs).
  };

  return NextResponse.json({
    data: {
      ...presented,
      payload: safePayload,
      trace_id: (row as { trace_id?: string | null }).trace_id ?? null,
      vision_configured: visionConfiguredForEnv(),
    },
  });
}
