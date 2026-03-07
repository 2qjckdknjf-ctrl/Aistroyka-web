import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import * as reportRepo from "@/lib/domain/reports/report.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/reports/:id — report detail with media (tenant-scoped). */
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

  const supabase = await createClientFromRequest(request);
  const report = await reportRepo.getById(supabase, id, ctx.tenantId!);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const media = await reportRepo.listMediaByReportId(supabase, id, ctx.tenantId!);
  return NextResponse.json({ data: { ...report, media } });
}
