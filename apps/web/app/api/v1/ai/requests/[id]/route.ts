import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const r = row as { type: string; payload?: unknown };
  if (!AI_JOB_TYPES.includes(r.type)) return NextResponse.json({ error: "Not an AI request" }, { status: 404 });

  return NextResponse.json({
    data: {
      id: (row as { id: string }).id,
      type: (row as { type: string }).type,
      status: (row as { status: string }).status,
      payload: (row as { payload?: unknown }).payload,
      attempts: (row as { attempts: number }).attempts,
      max_attempts: (row as { max_attempts: number }).max_attempts,
      last_error: (row as { last_error?: string | null }).last_error ?? null,
      last_error_type: (row as { last_error_type?: string | null }).last_error_type ?? null,
      trace_id: (row as { trace_id?: string | null }).trace_id ?? null,
      created_at: (row as { created_at: string }).created_at,
      updated_at: (row as { updated_at: string }).updated_at,
    },
  });
}
