/**
 * System metrics for /api/system/metrics.
 * Counts with safe fallbacks when data unavailable.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, getPublicConfig } from "@/lib/config";

export interface SystemMetricsResult {
  projects_count: number | null;
  tasks_count: number | null;
  reports_count: number | null;
  alerts_count: number | null;
  ai_signals_count: number | null;
  _meta?: { source: "database" | "placeholder"; at: string };
}

async function getCount(
  supabase: SupabaseClient,
  table: string,
  options?: { column?: string; tenantId?: string | null }
): Promise<number | null> {
  try {
    let q = supabase.from(table).select(options?.column ?? "id", { count: "exact", head: true });
    if (options?.tenantId) q = q.eq("tenant_id", options.tenantId);
    const { count, error } = await q;
    if (error) return null;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

export async function getSystemMetrics(_options?: { tenantId?: string | null }): Promise<SystemMetricsResult> {
  const at = new Date().toISOString();
  const placeholder: SystemMetricsResult = {
    projects_count: null,
    tasks_count: null,
    reports_count: null,
    alerts_count: null,
    ai_signals_count: null,
    _meta: { source: "placeholder", at },
  };

  if (!hasSupabaseEnv()) return placeholder;

  try {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getPublicConfig();
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const tenantId = _options?.tenantId ?? null;

    const [projects_count, tasks_count, reports_count, alerts_count, ai_signals_count] = await Promise.all([
      getCount(supabase, "projects", { tenantId }),
      getCount(supabase, "worker_tasks", { tenantId }),
      getCount(supabase, "worker_reports", { tenantId }),
      getCount(supabase, "alerts", { tenantId }),
      getAiSignalsCount(supabase),
    ]);

    return {
      projects_count: projects_count ?? 0,
      tasks_count: tasks_count ?? 0,
      reports_count: reports_count ?? 0,
      alerts_count: alerts_count ?? 0,
      ai_signals_count: ai_signals_count ?? 0,
      _meta: { source: "database", at },
    };
  } catch {
    return placeholder;
  }
}

async function getAiSignalsCount(supabase: SupabaseClient): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from("ai_requests")
      .select("id", { count: "exact", head: true });
    if (error) return null;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}
