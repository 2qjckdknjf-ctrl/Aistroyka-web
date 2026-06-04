import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";

const CreateMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await context.params;
  const supabase = await createClient();
  const db = supabase as any;
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ticket } = await db
    .from("support_tickets")
    .select("id, requester_user_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket || ticket.requester_user_id !== user.id) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const { data: messages, error } = await db
    .from("support_ticket_messages")
    .select("id, author_type, body, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });

  return NextResponse.json({ data: messages ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await context.params;
  const supabase = await createClient();
  const db = supabase as any;
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = CreateMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
  }

  const { data: ticket } = await db
    .from("support_tickets")
    .select("id, requester_user_id, status")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket || ticket.requester_user_id !== user.id) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const [{ error: messageError }, { error: updateError }] = await Promise.all([
    db.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      author_user_id: user.id,
      author_type: "user",
      body: parsed.data.body,
    }),
    db
      .from("support_tickets")
      .update({ status: "open", updated_at: nowIso, last_reply_at: nowIso })
      .eq("id", ticketId),
  ]);
  if (messageError || updateError) {
    return NextResponse.json({ error: "Unable to save support message." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
