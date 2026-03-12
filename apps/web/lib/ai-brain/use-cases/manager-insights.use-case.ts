/**
 * Use case: getManagerInsights(projectId).
 * Aggregates health, risks, and recommendations into manager-facing insights.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getProjectHealth,
  getReportSignals,
  getEvidenceSignals,
  getRiskSignals,
  getActionRecommendations,
} from "@/lib/ai-brain/services";
import { getTaskSignals } from "@/lib/ai-brain/mappers";
import type { ManagerInsight } from "@/lib/ai-brain/domain";

function nextId(): string {
  return `insight-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getManagerInsights(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ManagerInsight[]> {
  const [health, riskSignals, recommendations] = await Promise.all([
    getProjectHealth(supabase, projectId, tenantId),
    getRiskSignals(supabase, projectId, tenantId),
    getActionRecommendations(supabase, projectId, tenantId),
  ]);

  if (!health) return [];

  const at = new Date().toISOString();
  const insights: ManagerInsight[] = [];

  if (health.blockers.length > 0) {
    insights.push({
      id: nextId(),
      projectId,
      tenantId,
      type: "blocker",
      severity: health.label === "critical" ? "high" : "medium",
      title: "Blockers",
      body: health.blockers.join("; "),
      suggestedAction: "Address blockers to improve project health",
      at,
      source: "ai_brain",
    });
  }

  for (const r of riskSignals.slice(0, 5)) {
    insights.push({
      id: nextId(),
      projectId,
      tenantId,
      type: "risk",
      severity: r.severity,
      title: r.title,
      body: r.description ?? "",
      at: r.at,
      source: "ai_brain",
    });
  }

  for (const rec of recommendations.slice(0, 3)) {
    insights.push({
      id: nextId(),
      projectId,
      tenantId,
      type: "recommendation",
      severity: rec.priority,
      title: rec.title,
      body: rec.description ?? "",
      suggestedAction: rec.title,
      at: rec.at,
      source: "ai_brain",
    });
  }

  return insights;
}
