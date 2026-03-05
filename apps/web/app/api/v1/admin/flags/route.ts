/**
 * GET /api/v1/admin/flags — list all flags (admin).
 * POST /api/v1/admin/flags — create or update flag (key, description?, rollout_percent?, allowlist_tenant_ids?).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { listFlags, upsertFlag } from "@/lib/platform/flags";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const flags = await listFlags(admin);
  return NextResponse.json({ data: flags });
}

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const adminErr = requireAdmin(ctx, "write");
  if (adminErr) return adminErr;
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const rollout_percent =
    typeof body.rollout_percent === "number" && body.rollout_percent >= 0 && body.rollout_percent <= 100
      ? body.rollout_percent
      : null;
  const allowlist_tenant_ids = Array.isArray(body.allowlist_tenant_ids)
    ? body.allowlist_tenant_ids.filter((id: unknown) => typeof id === "string")
    : null;
  const { error } = await upsertFlag(admin, {
    key,
    description,
    rollout_percent,
    allowlist_tenant_ids: allowlist_tenant_ids?.length ? allowlist_tenant_ids : null,
  });
  if (error) return NextResponse.json({ error }, { status: 500 });
  await emitAudit(admin, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    action: "flag_upsert",
    resource_type: "feature_flag",
    resource_id: key,
    details: { key, description, rollout_percent },
  });
  return NextResponse.json({ success: true, key });
}
