import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  company: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export type ContactBody = z.infer<typeof ContactSchema>;

/**
 * POST /api/contact — public contact/demo form submission.
 * Validates input and persists to contact_leads table.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat().join(" ") || "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { name, email, company, message } = parsed.data;

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
    const { error } = await (supabase as { from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> } }).from("contact_leads").insert({
      name,
      email,
      company: company || null,
      message,
      source: "contact_form",
      status: "new",
    });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[contact] persist error", error);
      }
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] error", e);
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
