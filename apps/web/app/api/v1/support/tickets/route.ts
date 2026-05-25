import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getTenantForCurrentUser } from "@/lib/api/engine";

const CreateTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(3).max(4000),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const db = supabase as any;
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tickets, error } = await db
    .from("support_tickets")
    .select("id, subject, status, priority, tenant_id, created_at, updated_at, last_reply_at")
    .eq("requester_user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load tickets." }, { status: 500 });

  return NextResponse.json({ data: tickets ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const db = supabase as any;
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid support request payload." }, { status: 400 });
  }

  const tenantId = await getTenantForCurrentUser(supabase);
  const nowIso = new Date().toISOString();
  const { data: ticket, error: ticketError } = await db
    .from("support_tickets")
    .insert({
      tenant_id: tenantId,
      requester_user_id: user.id,
      subject: parsed.data.subject,
      priority: parsed.data.priority ?? "normal",
      status: "open",
      last_reply_at: nowIso,
      updated_at: nowIso,
    })
    .select("id, subject, status, priority, tenant_id, created_at, updated_at, last_reply_at")
    .single();
  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Unable to create ticket." }, { status: 500 });
  }

  const { error: messageError } = await db.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    author_user_id: user.id,
    author_type: "user",
    body: parsed.data.message,
  });
  if (messageError) {
    return NextResponse.json({ error: "Ticket created, but first message failed to save." }, { status: 500 });
  }

  return NextResponse.json({ data: ticket }, { status: 201 });
}
