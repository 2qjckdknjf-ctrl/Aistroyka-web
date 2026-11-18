import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BulkLeadPatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  status: z.enum(["new", "reviewed", "contacted", "archived"]),
  notes: z.string().max(10000).nullable().optional(),
});

/**
 * PATCH /api/v1/platform/leads/bulk
 * Bulk update lead status/notes by id list (platform owner only).
 */
export async function PATCH(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

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
