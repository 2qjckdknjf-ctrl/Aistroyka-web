/**
 * GET /api/v1/admin/leads — list contact leads (admin only).
 * Uses service role; contact_leads has no tenant_id (platform-level).
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { requirePlatformOwnerLegacyAdminRoute } from "@/lib/api/require-platform-admin-legacy-route";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  status: string;
  notes: string | null;
};

export async function GET(request: Request) {
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
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);

  let query = admin
    .from("contact_leads")
    .select("id, created_at, name, email, company, message, source, status, notes")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && ["new", "reviewed", "contacted", "archived"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []) as LeadRow[] });
}
