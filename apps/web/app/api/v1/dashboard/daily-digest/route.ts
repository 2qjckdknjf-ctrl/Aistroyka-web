/**
 * GET /api/v1/dashboard/daily-digest — Manager portfolio digest (Phase 7).
 */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { buildManagerPortfolioDailyDigest } from "@/lib/domain/digest/daily-digest.service";
import type { DailyDigestTranslate } from "@/lib/domain/digest/daily-digest.types";
import { resolveRequestLocale } from "@/lib/i18n/resolve-request-locale";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  if (!canManageProjects(ctx)) {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const locale = resolveRequestLocale(request);
  const tNs = await getTranslations({ locale, namespace: "dailyDigest" });
  const t: DailyDigestTranslate = (key, values) => tNs(key as never, values as never);
  const data = await buildManagerPortfolioDailyDigest(supabase, ctx, t);
  if (!data) {
    return NextResponse.json({ error: "Unable to build digest" }, { status: 403 });
  }
  return NextResponse.json({ data });
}
