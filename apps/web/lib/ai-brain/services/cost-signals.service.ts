/**
 * Cost pressure signals: over-budget, cost item overrun.
 * Fact-based; no fake precision.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "../domain";

export async function getCostRiskSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<RiskSignal[]> {
  const { data: items, error } = await supabase
    .from("project_cost_items")
    .select("id, title, planned_amount, actual_amount, currency, status")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .neq("status", "archived");
  if (error) throw new Error("cost_risk_items_query_failed");

  const rows = (items ?? []) as Array<{
    id: string;
    title: string;
    planned_amount: number;
    actual_amount: number;
    currency: string;
    status: string;
  }>;
  if (rows.length === 0) return [];

  const at = new Date().toISOString();
  const risks: RiskSignal[] = [];
  const currency = rows[0]?.currency ?? "RUB";
  const plannedTotal = rows.reduce((sum, r) => sum + Number(r.planned_amount ?? 0), 0);
  const actualTotal = rows.reduce((sum, r) => sum + Number(r.actual_amount ?? 0), 0);

  if (actualTotal > plannedTotal) {
    risks.push({
      projectId,
      source: "budget_overrun",
      severity: "high",
      title: "Project over budget",
      description: `Actual (${actualTotal.toFixed(0)} ${currency}) exceeds planned (${plannedTotal.toFixed(0)} ${currency})`,
      at,
      resourceType: "project_budget",
      resourceId: projectId,
    });
  } else if (plannedTotal > 0) {
    const ratio = actualTotal / plannedTotal;
    if (ratio >= 0.9) {
      risks.push({
        projectId,
        source: "cost_pressure",
        severity: "medium",
        title: "Budget pressure",
        description: `Spent ${(ratio * 100).toFixed(0)}% of planned budget`,
        at,
        resourceType: "project_budget",
        resourceId: projectId,
      });
    }
  }

  for (const r of rows) {
    const planned = Number(r.planned_amount ?? 0);
    const actual = Number(r.actual_amount ?? 0);
    if (planned > 0 && actual > planned) {
      risks.push({
        projectId,
        source: "cost_pressure",
        severity: "medium",
        title: "Cost item overrun",
        description: `"${r.title}": actual ${actual.toFixed(0)} > planned ${planned.toFixed(0)} ${r.currency}`,
        at,
        resourceType: "cost_item",
        resourceId: r.id,
      });
    }
  }

  return risks;
}
