import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";

async function emailsByUserId(userIds: string[]): Promise<Record<string, string>> {
  const admin = getAdminClient();
  if (!admin) return {};
  const unique = [...new Set(userIds.filter((id) => id.trim().length > 0))];
  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      const email = data.user?.email?.trim();
      if (email && email.includes("@")) out[id] = email;
    })
  );
  return out;
}

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "tenant:invite")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const supabase = await createClient();
  const tenantId = ctx.tenantId;

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("id", tenantId)
    .single();

  const { data: rows } = await supabase
    .from("tenant_members")
    .select("user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  const emails = await emailsByUserId((rows ?? []).map((r) => r.user_id));

  const members = (rows ?? []).map((r) => ({
    user_id: r.user_id,
    role: r.role,
    created_at: r.created_at,
    is_owner: tenantRow?.user_id === r.user_id,
    email: emails[r.user_id] ?? null,
  }));

  return NextResponse.json({ data: members });
}
