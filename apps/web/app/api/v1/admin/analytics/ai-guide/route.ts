import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";

export const dynamic = "force-dynamic";

type EventRow = {
  event_type: "open" | "ask" | "quick_prompt" | "action_click";
  role: "manager" | "admin" | "client" | "owner" | "worker";
  locale: "en" | "ru" | "es" | "it";
  pathname: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function dateKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

type AreaKey = "dashboard" | "projects" | "reports" | "ai" | "other";

function detectArea(pathname: string): AreaKey {
  const normalized = pathname.toLowerCase();
  if (normalized.includes("/projects")) return "projects";
  if (normalized.includes("/reports") || normalized.includes("/daily-reports")) return "reports";
  if (normalized.includes("/dashboard/ai")) return "ai";
  if (normalized.includes("/dashboard")) return "dashboard";
  return "other";
}

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (error) {
    if (error instanceof TenantRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "7d";
  const areaFilter = url.searchParams.get("area") ?? "all";
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_guide_events")
    .select("event_type, role, locale, pathname, payload, created_at")
    .eq("tenant_id", ctx.tenantId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as EventRow[];

  const totals = {
    opens: 0,
    asks: 0,
    quickPrompts: 0,
    actionClicks: 0,
  };

  const byDayMap = new Map<string, { date: string; opens: number; asks: number; quickPrompts: number; actionClicks: number }>();
  const byRoleMap = new Map<string, number>();
  const byLocaleMap = new Map<string, number>();
  const topActionsMap = new Map<string, { key: string; href: string; count: number }>();
  const byAreaMap = new Map<AreaKey, number>();
  const roleConversionMap = new Map<string, { role: string; asks: number; actionClicks: number }>();

  for (const row of rows) {
    const area = detectArea(row.pathname);
    byAreaMap.set(area, (byAreaMap.get(area) ?? 0) + 1);
    if (areaFilter !== "all" && area !== areaFilter) {
      continue;
    }

    if (row.event_type === "open") totals.opens += 1;
    if (row.event_type === "ask") totals.asks += 1;
    if (row.event_type === "quick_prompt") totals.quickPrompts += 1;
    if (row.event_type === "action_click") totals.actionClicks += 1;

    const day = dateKey(row.created_at);
    const dayRow = byDayMap.get(day) ?? { date: day, opens: 0, asks: 0, quickPrompts: 0, actionClicks: 0 };
    if (row.event_type === "open") dayRow.opens += 1;
    if (row.event_type === "ask") dayRow.asks += 1;
    if (row.event_type === "quick_prompt") dayRow.quickPrompts += 1;
    if (row.event_type === "action_click") dayRow.actionClicks += 1;
    byDayMap.set(day, dayRow);

    byRoleMap.set(row.role, (byRoleMap.get(row.role) ?? 0) + 1);
    byLocaleMap.set(row.locale, (byLocaleMap.get(row.locale) ?? 0) + 1);
    const roleConv = roleConversionMap.get(row.role) ?? { role: row.role, asks: 0, actionClicks: 0 };
    if (row.event_type === "ask") roleConv.asks += 1;
    if (row.event_type === "action_click") roleConv.actionClicks += 1;
    roleConversionMap.set(row.role, roleConv);

    if (row.event_type === "action_click") {
      const payload = row.payload ?? {};
      const key = String(payload.actionId ?? payload.signalId ?? "unknown");
      const href = String(payload.href ?? row.pathname ?? "/dashboard");
      const prev = topActionsMap.get(key) ?? { key, href, count: 0 };
      prev.count += 1;
      topActionsMap.set(key, prev);
    }
  }

  const engagementRate = totals.opens > 0 ? Math.round(((totals.asks + totals.quickPrompts) / totals.opens) * 100) : 0;
  const completionRate = totals.asks > 0 ? Math.round((totals.actionClicks / totals.asks) * 100) : 0;

  const byDay = [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const byRole = [...byRoleMap.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);
  const byLocale = [...byLocaleMap.entries()]
    .map(([locale, count]) => ({ locale, count }))
    .sort((a, b) => b.count - a.count);
  const byArea = [...byAreaMap.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);
  const byRoleConversion = [...roleConversionMap.values()]
    .map((row) => ({
      role: row.role,
      asks: row.asks,
      actionClicks: row.actionClicks,
      completionRate: row.asks > 0 ? Math.round((row.actionClicks / row.asks) * 100) : 0,
    }))
    .sort((a, b) => b.asks - a.asks);
  const topActions = [...topActionsMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return NextResponse.json({
    range: `${days}d`,
    area: areaFilter,
    totals: {
      ...totals,
      engagementRate,
      completionRate,
    },
    byDay,
    byRole,
    byLocale,
    byArea,
    byRoleConversion,
    topActions,
  });
}

