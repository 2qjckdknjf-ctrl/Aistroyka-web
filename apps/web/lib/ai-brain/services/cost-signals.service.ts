/**
 * Cost pressure signals: over-budget, cost item overrun.
 * Fact-based; no fake precision.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "../domain";
import { getBudgetSummary } from "@/lib/domain/costs/cost.repository";

export async function getCostRiskSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<RiskSignal[]> {
  const summary = await getBudgetSummary(supabase, projectId, tenantId);
  if (!summary || summary.item_count === 0) return [];

  const at = new Date().toISOString();
  const risks: RiskSignal[] = [];

  if (summary.over_budget) {
    risks.push({
      projectId,
      source: "budget_overrun",
      severity: "high",
      title: "Project over budget",
      description: `Actual (${summary.actual_total.toFixed(0)} ${summary.currency}) exceeds planned (${summary.planned_total.toFixed(0)} ${summary.currency})`,
      at,
      resourceType: "project_budget",
      resourceId: projectId,
    });
  } else if (summary.planned_total > 0) {
    const ratio = summary.actual_total / summary.planned_total;
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

  const { data: items } = await supabase
    .from("project_cost_items")
    .select("id, title, planned_amount, actual_amount, currency")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .neq("status", "archived");

  const rows = (items ?? []) as { id: string; title: string; planned_amount: number; actual_amount: number; currency: string }[];
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
