import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

type AssistantEventRequest = {
  type?: "open" | "ask" | "quick_prompt" | "action_click";
  role?: string;
  locale?: string;
  pathname?: string;
  payload?: Record<string, string | number | boolean | null>;
};

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (error) {
    if (error instanceof TenantRequiredError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    throw error;
  }

  let body: AssistantEventRequest;
  try {
    body = (await request.json()) as AssistantEventRequest;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.type) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type = body.type;
  const role = body.role ?? "manager";
  const locale = body.locale ?? "en";
  const pathname = body.pathname ?? "/dashboard";

  const supabase = await createClientFromRequest(request);
  await supabase.from("ai_guide_events").insert({
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    event_type: type,
    role,
    locale,
    pathname,
    payload: body.payload ?? {},
  });

  return NextResponse.json({
    ok: true,
    accepted: {
      type,
      role,
      locale,
      pathname,
    },
  });
}

