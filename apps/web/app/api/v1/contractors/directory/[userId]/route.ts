/**
 * GET /api/v1/contractors/directory/:userId — detail + metrics
 * PATCH — upsert internal profile (company, specs, notes)
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantForbiddenError, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import {
  getContractorDirectoryDetail,
  upsertContractorProfile,
  type ContractorProfilePatch,
} from "@/lib/domain/contractor-directory/contractor-directory.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

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

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getContractorDirectoryDetail(supabase, ctx, userId);
  if (error) {
    const status =
      error === "Tenant required"
        ? 401
        : error === "Forbidden" || error === "Insufficient rights"
          ? 403
          : error === "Not a contractor for this tenant"
            ? 404
            : 400;
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

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

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: ContractorProfilePatch = {};
  if (typeof body.company_name === "string") patch.company_name = body.company_name;
  if (typeof body.phone === "string") patch.phone = body.phone;
  if (typeof body.email === "string") patch.email = body.email;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (body.status === "active" || body.status === "inactive" || body.status === "archived") {
    patch.status = body.status;
  }
  if (Array.isArray(body.specializations)) {
    patch.specializations = body.specializations.filter((x): x is string => typeof x === "string");
  } else if (typeof body.specializations === "string") {
    patch.specializations = body.specializations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await upsertContractorProfile(supabase, ctx, userId, patch);
  if (error) {
    const status =
      error === "Tenant required"
        ? 401
        : error === "Forbidden" || error === "Insufficient rights"
          ? 403
          : error === "Not a contractor for this tenant"
            ? 404
            : 400;
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ data });
}
