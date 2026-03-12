/**
 * Recommendation engine: produces actionable recommendations from signals.
 * Scaffold: deterministic from health + risks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionRecommendation } from "../domain";
import { getProjectHealth } from "./project-health.service";
import { getRiskSignals } from "./risk-intelligence.service";

function uuid(): string {
  return "rec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

export async function getActionRecommendations(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ActionRecommendation[]> {
  const at = new Date().toISOString();
  const [health, risks] = await Promise.all([
    getProjectHealth(supabase, projectId, tenantId),
    getRiskSignals(supabase, projectId, tenantId),
  ]);

  const actions: ActionRecommendation[] = [];

  if (!health) return actions;

  if (health.blockers.length > 0) {
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "follow_up",
      title: "Resolve blockers",
      description: health.blockers.join(". "),
      priority: "high",
      at,
    });
  }

  if (health.missingData.length > 0) {
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "request_evidence",
      title: "Improve reporting",
      description: health.missingData.join(". "),
      priority: "medium",
      at,
    });
  }

  const highRisks = risks.filter((r) => r.severity === "high");
  if (highRisks.length > 0) {
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "review",
      title: "Review high-priority risks",
      description: highRisks.map((r) => r.title).join("; "),
      priority: "high",
      at,
    });
  }

  return actions;
}
