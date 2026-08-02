/**
 * POST /api/v1/contact — canonical public contact/demo form submission.
 *
 * Abuse order:
 * 1) cheap Content-Length body-size guard
 * 2) admin client required
 * 3) trusted CF IP (fail closed when missing/invalid/trust off)
 * 4) atomic single-key IP rate limit
 * 5) bounded body read + JSON/schema validation
 * 6) exactly one contact_leads insert
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { insertContactLead } from "@/lib/public/contact-lead-submit";
import {
  rateLimitExceededResponse,
  rateLimitUnavailableResponse,
  resolveTrustedClientIp,
} from "@/lib/platform/rate-limit/rate-limit.service";
import {
  CONTACT_MAX_BODY_BYTES,
  CONTACT_PAYLOAD_TOO_LARGE_CODE,
  checkPublicContactRateLimit,
} from "@/lib/platform/rate-limit/public-contact-rate-limit";

export const dynamic = "force-dynamic";

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  company: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export type ContactBody = z.infer<typeof ContactSchema>;

function payloadTooLargeResponse(): NextResponse {
  return NextResponse.json(
    { error: "Payload too large", code: CONTACT_PAYLOAD_TOO_LARGE_CODE },
    { status: 413 }
  );
}

function rejectIfDeclaredBodyTooLarge(request: Request): NextResponse | null {
  const cl = request.headers.get("content-length");
  if (cl) {
    const n = Number(cl);
    if (Number.isFinite(n) && n > CONTACT_MAX_BODY_BYTES) {
      return payloadTooLargeResponse();
    }
  }
  return null;
}

async function readJsonBodyBounded(
  request: Request
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid body" }, { status: 400 }),
    };
  }
  if (text.length > CONTACT_MAX_BODY_BYTES) {
    return { ok: false, response: payloadTooLargeResponse() };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

export async function POST(request: Request) {
  const oversized = rejectIfDeclaredBodyTooLarge(request);
  if (oversized) return oversized;

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  const { trustedIp } = resolveTrustedClientIp(request);
  if (!trustedIp) {
    return rateLimitUnavailableResponse();
  }

  const rate = await checkPublicContactRateLimit(supabase, trustedIp);
  if (!rate.ok) {
    if (rate.kind === "unavailable") return rateLimitUnavailableResponse(rate.message);
    return rateLimitExceededResponse(rate);
  }

  const bodyRead = await readJsonBodyBounded(request);
  if (!bodyRead.ok) return bodyRead.response;

  const parsed = ContactSchema.safeParse(bodyRead.value);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = Object.values(first).flat().join(" ") || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, company, message } = parsed.data;
  const { error } = await insertContactLead(supabase, { name, email, company, message });
  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] persist error", error);
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
