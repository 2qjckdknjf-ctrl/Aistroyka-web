import type { SupabaseClient } from "@supabase/supabase-js";
import { RECURRING_RULE_KINDS, type RecurringOperationalRuleRow } from "./recurring-operations.types";

export async function listRulesForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<RecurringOperationalRuleRow[]> {
  const { data, error } = await supabase
    .from("recurring_operational_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("rule_kind", { ascending: true });
  if (error) return [];
  return (data ?? []) as RecurringOperationalRuleRow[];
}

export async function updateRuleActive(
  supabase: SupabaseClient,
  tenantId: string,
  ruleId: string,
  active: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from("recurring_operational_rules")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", ruleId)
    .eq("tenant_id", tenantId);
  return !error;
}

export async function fetchDueRules(admin: SupabaseClient, nowIso: string): Promise<RecurringOperationalRuleRow[]> {
  const { data, error } = await admin.from("recurring_operational_rules").select("*").eq("active", true);
  if (error) return [];
  return (data ?? []).filter((r: RecurringOperationalRuleRow) => {
    if (!r.next_due_at) return true;
    return r.next_due_at <= nowIso;
  }) as RecurringOperationalRuleRow[];
}

export async function updateRuleSchedule(
  admin: SupabaseClient,
  ruleId: string,
  lastFiredAt: string,
  nextDueAt: string
): Promise<void> {
  await admin
    .from("recurring_operational_rules")
    .update({ last_fired_at: lastFiredAt, next_due_at: nextDueAt, updated_at: new Date().toISOString() })
    .eq("id", ruleId);
}

export async function insertFireEvent(
  admin: SupabaseClient,
  row: {
    tenant_id: string;
    rule_id: string;
    project_id: string | null;
    rule_kind: string;
    dedupe_key: string;
    payload?: Record<string, unknown>;
  }
): Promise<boolean> {
  const { error } = await admin.from("recurring_automation_fire_events").insert({
    tenant_id: row.tenant_id,
    rule_id: row.rule_id,
    project_id: row.project_id,
    rule_kind: row.rule_kind,
    dedupe_key: row.dedupe_key,
    payload: row.payload ?? {},
  });
  if (error?.code === "23505") return false;
  return !error;
}

/** Latest fire per project+kind in lookback window — for workload merge */
export async function listRecentFiresForWorkload(
  supabase: SupabaseClient,
  tenantId: string,
  lookbackDays: number
): Promise<{ project_id: string | null; rule_kind: string; fired_at: string; project_name: string | null }[]> {
  const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();
  const { data, error } = await supabase
    .from("recurring_automation_fire_events")
    .select("project_id, rule_kind, fired_at")
    .eq("tenant_id", tenantId)
    .gte("fired_at", since)
    .order("fired_at", { ascending: false });
  if (error || !data?.length) return [];

  const projectIds = [...new Set((data as { project_id: string | null }[]).map((r) => r.project_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .in("id", projectIds);
    for (const p of projects ?? []) {
      names.set((p as { id: string; name: string }).id, (p as { id: string; name: string }).name);
    }
  }

  const seen = new Set<string>();
  const out: { project_id: string | null; rule_kind: string; fired_at: string; project_name: string | null }[] = [];
  for (const row of data as { project_id: string | null; rule_kind: string; fired_at: string }[]) {
    const pid = row.project_id;
    const key = `${row.rule_kind}:${pid ?? "tenant"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      project_id: pid,
      rule_kind: row.rule_kind,
      fired_at: row.fired_at,
      project_name: pid ? names.get(pid) ?? null : null,
    });
  }
  return out;
}

export async function ensureDefaultRulesForTenant(admin: SupabaseClient, tenantId: string): Promise<void> {
  const now = new Date().toISOString();
  for (const kind of RECURRING_RULE_KINDS) {
    const { error } = await admin.from("recurring_operational_rules").insert({
      tenant_id: tenantId,
      project_id: null,
      rule_kind: kind,
      audience: "manager",
      cadence: "every_n_days",
      cadence_days: 7,
      active: true,
      next_due_at: now,
    });
    if (error && error.code !== "23505") {
      // non-duplicate error — best-effort skip
    }
  }
}
