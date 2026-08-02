import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (error) {
    if (error instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (error instanceof TenantRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const supabase = await createClientFromRequest(request);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [opens, asks, quickPrompts, actionClicks] = await Promise.all([
    supabase
      .from("ai_guide_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("event_type", "open")
      .gte("created_at", since),
    supabase
      .from("ai_guide_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("event_type", "ask")
      .gte("created_at", since),
    supabase
      .from("ai_guide_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("event_type", "quick_prompt")
      .gte("created_at", since),
    supabase
      .from("ai_guide_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("event_type", "action_click")
      .gte("created_at", since),
  ]);

  const openCount = opens.count ?? 0;
  const askCount = asks.count ?? 0;
  const promptCount = quickPrompts.count ?? 0;
  const clickCount = actionClicks.count ?? 0;
  const engagement = openCount > 0 ? Math.round(((askCount + promptCount) / openCount) * 100) : 0;
  const completion = askCount > 0 ? Math.round((clickCount / askCount) * 100) : 0;

  return NextResponse.json({
    range: "7d",
    metrics: {
      opens: openCount,
      asks: askCount,
      quickPrompts: promptCount,
      actionClicks: clickCount,
      engagementRate: engagement,
      completionRate: completion,
    },
  });
}

