/**
 * PATCH /api/tenant/profile — update tenant profile (workspace name).
 * Requires tenant:settings (admin or owner).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize, LitePathForbiddenError } from "@/lib/tenant";

const MAX_NAME_LENGTH = 200;

export async function PATCH(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "tenant:settings")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ name: name || null })
    .eq("id", ctx.tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { name: name || null } });
}
