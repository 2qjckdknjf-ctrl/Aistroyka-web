import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { requirePlatformOwnerLegacyAdminRoute } from "@/lib/api/require-platform-admin-legacy-route";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BulkLeadPatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  status: z.enum(["new", "reviewed", "contacted", "archived"]),
  notes: z.string().max(10000).nullable().optional(),
});

/**
 * PATCH /api/v1/admin/leads/bulk
 * Bulk update lead status/notes by id list (admin only).
 */
export async function PATCH(request: Request) {
  const platformErr = await requirePlatformOwnerLegacyAdminRoute(request);
  if (platformErr) return platformErr;

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
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BulkLeadPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: { status: string; notes?: string | null } = {
    status: parsed.data.status,
  };
  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes;
  }

  const { data, error } = await admin
    .from("contact_leads")
    // @ts-expect-error contact_leads update row type not in generated DB types
    .update(updates)
    .in("id", parsed.data.ids)
    .select("id, status, notes");

  if (error) {
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    updated: (data ?? []).length,
    data: data ?? [],
  });
}
