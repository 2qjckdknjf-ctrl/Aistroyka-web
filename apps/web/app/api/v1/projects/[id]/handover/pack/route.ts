/**
 * GET /api/v1/projects/:id/handover/pack — customer-safe handover pack preview (Phase 9).
 * Manager: readiness + customer-aligned sections. Owner/stakeholder: sections from portal view only.
 */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { resolveRequestLocale } from "@/lib/i18n/resolve-request-locale";
import { buildManagerHandoverPack, buildOwnerHandoverPack } from "@/lib/domain/project-handover/handover-pack.service";
import type { HandoverPackTranslate } from "@/lib/domain/project-handover/handover-pack.types";
import { canManageProjectHandover, canReadProjectHandover } from "@/lib/domain/project-handover/project-handover.policy";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const locale = resolveRequestLocale(request);
  const tNs = await getTranslations({ locale, namespace: "handoverPack" });
  const translate: HandoverPackTranslate = (key, values) => tNs(key as never, values as never);

  if (await canManageProjectHandover(supabase, ctx, projectId)) {
    const { data, error } = await buildManagerHandoverPack(supabase, ctx, projectId, translate);
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 400 });
    return NextResponse.json({ data });
  }

  if (await canReadProjectHandover(supabase, ctx, projectId)) {
    const { data, error } = await buildOwnerHandoverPack(supabase, ctx, projectId, translate);
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Not available" }, { status: 404 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
}
