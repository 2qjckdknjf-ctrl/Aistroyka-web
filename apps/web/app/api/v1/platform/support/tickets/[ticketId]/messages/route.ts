import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";

const ReplySchema = z.object({
  body: z.string().trim().min(1).max(4000),
  status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;
  const { ticketId } = await context.params;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }
  const db = admin as any;

  const { data: messages, error } = await db
    .from("support_ticket_messages")
    .select("id, author_type, author_user_id, body, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Unable to load support thread." }, { status: 500 });
  return NextResponse.json({ data: messages ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;
  const { ticketId } = await context.params;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }
  const db = admin as any;

  const body = await request.json().catch(() => ({}));
  const parsed = ReplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid reply payload." }, { status: 400 });

  const nowIso = new Date().toISOString();
  const ticketStatus = parsed.data.status ?? "waiting_user";
  const [{ error: messageError }, { error: updateError }] = await Promise.all([
    db.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      author_user_id: auth.userId,
      author_type: "platform_owner",
      body: parsed.data.body,
    }),
    db
      .from("support_tickets")
      .update({
        status: ticketStatus,
        updated_at: nowIso,
        last_reply_at: nowIso,
      })
      .eq("id", ticketId),
  ]);
  if (messageError || updateError) {
    return NextResponse.json({ error: "Unable to save support reply." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
