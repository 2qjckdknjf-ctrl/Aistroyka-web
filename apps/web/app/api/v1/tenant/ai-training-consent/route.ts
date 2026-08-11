/**
 * GET/PATCH /api/v1/tenant/ai-training-consent
 * Owner/admin only. Updates tenants.ai_training_consent with audit log.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest, getSessionUser } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { hasMinRole } from "@/lib/auth/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getTrainingConsent,
  updateTrainingConsent,
} from "@/lib/platform/ai-flywheel/training-consent.service";

export const dynamic = "force-dynamic";

function parseConsentBody(body: unknown): { aiTrainingConsent: boolean } | null {
  if (typeof body !== "object" || body === null) return null;
  const v = (body as Record<string, unknown>).aiTrainingConsent;
  if (typeof v !== "boolean") return null;
  return { aiTrainingConsent: v };
}

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  if (!(await hasMinRole(supabase, ctx.tenantId!, "admin"))) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const state = await getTrainingConsent(supabase, ctx.tenantId!);
  if (!state) {
    return NextResponse.json({ error: "Unable to read consent state" }, { status: 500 });
  }

  return NextResponse.json({ data: state });
}

export async function PATCH(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  if (!(await hasMinRole(supabase, ctx.tenantId!, "admin"))) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseConsentBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "aiTrainingConsent boolean required" }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  const traceId = request.headers.get("x-trace-id");

  const result = await updateTrainingConsent(admin, {
    tenantId: ctx.tenantId!,
    userId: user?.id ?? ctx.userId ?? "",
    traceId,
    consent: parsed.aiTrainingConsent,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: { aiTrainingConsent: result.aiTrainingConsent } });
}
