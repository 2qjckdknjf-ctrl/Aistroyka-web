/**
 * GET /api/v1/admin/security/posture — security posture JSON (admin only).
 * Includes: debug flags off in prod, retention policy, SSO enabled, last 30d critical alerts count.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getSecurityPosture } from "@/lib/platform/admin/security-posture.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const supabase = await createClient();
  const { data, error } = await getSecurityPosture(supabase, ctx);

  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Security posture data not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
