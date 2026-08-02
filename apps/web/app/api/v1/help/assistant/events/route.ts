import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  abortHelpLiteIdempotency,
  clampString,
  commitHelpLiteIdempotency,
  enforceHelpAbuseGuards,
  HELP_MAX_LOCALE_LEN,
  HELP_MAX_PATHNAME_LEN,
  HELP_MAX_ROLE_LEN,
  isHelpEventType,
  readJsonBodyBounded,
  requireHelpTenant,
  sanitizePayload,
} from "@/lib/help/help-api.shared";

const ROUTE_KEY = "POST /api/v1/help/assistant/events";
const ENDPOINT = "/api/v1/help/assistant/events";

async function abortOr(request: Request, response: NextResponse): Promise<NextResponse> {
  const abort = await abortHelpLiteIdempotency(request);
  return abort ?? response;
}

export async function POST(request: Request) {
  const auth = await requireHelpTenant(request);
  if (!auth.ok) return auth.response;

  const guards = await enforceHelpAbuseGuards(request, auth.ctx, ENDPOINT, ROUTE_KEY);
  if (guards) return guards;

  const body = await readJsonBodyBounded(request);
  if (!body.ok) {
    return abortOr(request, body.response);
  }

  if (body.value == null || typeof body.value !== "object" || Array.isArray(body.value)) {
    return abortOr(
      request,
      NextResponse.json({ ok: false, error: "Invalid body", code: "invalid_json" }, { status: 400 })
    );
  }

  const raw = body.value as Record<string, unknown>;
  if (!isHelpEventType(raw.type)) {
    return abortOr(
      request,
      NextResponse.json({ ok: false, error: "Invalid event type", code: "invalid_event_type" }, { status: 400 })
    );
  }

  if (typeof raw.role === "string" && raw.role.length > HELP_MAX_ROLE_LEN) {
    return abortOr(
      request,
      NextResponse.json({ ok: false, error: "role too long", code: "payload_too_large" }, { status: 413 })
    );
  }
  if (typeof raw.locale === "string" && raw.locale.length > HELP_MAX_LOCALE_LEN) {
    return abortOr(
      request,
      NextResponse.json({ ok: false, error: "locale too long", code: "payload_too_large" }, { status: 413 })
    );
  }
  if (typeof raw.pathname === "string" && raw.pathname.length > HELP_MAX_PATHNAME_LEN) {
    return abortOr(
      request,
      NextResponse.json({ ok: false, error: "pathname too long", code: "payload_too_large" }, { status: 413 })
    );
  }

  const type = raw.type;
  const role = clampString(raw.role, HELP_MAX_ROLE_LEN) ?? "manager";
  const locale = clampString(raw.locale, HELP_MAX_LOCALE_LEN) ?? "en";
  const pathname = clampString(raw.pathname, HELP_MAX_PATHNAME_LEN) ?? "/dashboard";

  const payloadResult = sanitizePayload(raw.payload);
  if (!payloadResult.ok) {
    return abortOr(request, payloadResult.response);
  }

  const supabase = await createClientFromRequest(request);
  const { error } = await supabase.from("ai_guide_events").insert({
    tenant_id: auth.ctx.tenantId,
    user_id: auth.ctx.userId,
    event_type: type,
    role,
    locale,
    pathname,
    payload: payloadResult.value,
  });

  if (error) {
    return abortOr(
      request,
      NextResponse.json(
        { ok: false, error: "Failed to record event", code: "event_insert_failed" },
        { status: 500 }
      )
    );
  }

  const responseBody = {
    ok: true,
    accepted: {
      type,
      role,
      locale,
      pathname,
    },
  };
  const finalizeFail = await commitHelpLiteIdempotency(request, auth.ctx, ROUTE_KEY, responseBody, 200);
  if (finalizeFail) return finalizeFail;
  return NextResponse.json(responseBody);
}
