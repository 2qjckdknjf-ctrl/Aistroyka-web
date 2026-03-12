import { NextResponse } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  company: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export type ContactBody = z.infer<typeof ContactSchema>;

/**
 * POST /api/contact — public contact/demo form submission.
 * Validates input; does not persist by default (add DB or email integration as needed).
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

    // TODO: persist to DB, send email, or forward to CRM. For now we only validate and return success.
    if (process.env.NODE_ENV !== "production") {
      console.info("[contact]", { name, email, company, messageLength: message.length });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] error", e);
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
