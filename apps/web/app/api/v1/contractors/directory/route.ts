/**
 * GET /api/v1/contractors/directory — internal manager directory (Phase 11).
 * Query: q, specialization
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantForbiddenError, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { listContractorDirectory } from "@/lib/domain/contractor-directory/contractor-directory.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const specialization = url.searchParams.get("specialization") ?? undefined;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listContractorDirectory(supabase, ctx, { q, specialization });
  if (error) {
    const status =
      error === "Tenant required"
        ? 401
        : error === "Forbidden" || error === "Insufficient rights"
          ? 403
          : 400;
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ data });
}
