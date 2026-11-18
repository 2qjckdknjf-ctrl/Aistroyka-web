import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { insertContactLead } from "@/lib/public/contact-lead-submit";
import { sanitizeLeadAttribution } from "@/lib/public/lead-attribution";

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  company: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  landing_page: z.string().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  locale: z.string().max(16).optional(),
});

export type ContactBody = z.infer<typeof ContactSchema>;

/**
 * POST /api/v1/contact — public contact/demo form submission.
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
    const { name, email, company, message, ...rawAttribution } = parsed.data;
    const attribution = sanitizeLeadAttribution(rawAttribution);

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
    const { error } = await insertContactLead(supabase, { name, email, company, message, attribution });

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
