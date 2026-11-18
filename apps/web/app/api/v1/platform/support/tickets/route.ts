import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";

const UpdateTicketSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 300);

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }
  const db = admin as any;

  let query = db
    .from("support_tickets")
    .select("id, tenant_id, requester_user_id, subject, status, priority, created_at, updated_at, last_reply_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (statusFilter) query = query.eq("status", statusFilter);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load support tickets." }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }
  const db = admin as any;

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateTicketSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });

  const { error } = await db
    .from("support_tickets")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.ticketId);
  if (error) return NextResponse.json({ error: "Unable to update ticket status." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
