/**
 * Recommendation engine: produces actionable recommendations from signals.
 * Scaffold: deterministic from health + risks + pending approvals.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionRecommendation } from "../domain";
import { getBudgetSummary } from "@/lib/domain/costs/cost.repository";
import { getProjectHealth } from "./project-health.service";
import { getRiskSignals } from "./risk-intelligence.service";

function uuid(): string {
  return "rec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

async function getPendingReportsCount(supabase: SupabaseClient, tenantId: string): Promise<number> {
  const { count } = await supabase
    .from("worker_reports")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "submitted");
  return count ?? 0;
}

async function getPendingDocumentsCount(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<number> {
  const { count } = await supabase
    .from("project_documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .eq("status", "under_review");
  return count ?? 0;
}

async function isProjectOverBudget(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<boolean> {
  const summary = await getBudgetSummary(supabase, projectId, tenantId);
  if (!summary || summary.planned_total <= 0) return false;
  return summary.actual_total > summary.planned_total;
}

export async function getActionRecommendations(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ActionRecommendation[]> {
  const at = new Date().toISOString();
  const [health, risks, pendingReportsCount, pendingDocumentsCount, overBudget] = await Promise.all([
    getProjectHealth(supabase, projectId, tenantId),
    getRiskSignals(supabase, projectId, tenantId),
    getPendingReportsCount(supabase, tenantId),
    getPendingDocumentsCount(supabase, projectId, tenantId),
    isProjectOverBudget(supabase, projectId, tenantId),
  ]);

  const actions: ActionRecommendation[] = [];

  if (overBudget) {
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "follow_up",
      title: "Review project budget",
      description: "Project is over budget. Review cost items and planned vs actual.",
      priority: "high",
      at,
      relatedResourceType: "costs",
      relatedResourceId: projectId,
    });
  }

  if (pendingDocumentsCount > 0) {
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "review",
      title: "Review pending documents",
      description: `${pendingDocumentsCount} document(s) awaiting approval`,
      priority: "medium",
      at,
      relatedResourceType: "documents",
      relatedResourceId: projectId,
    });
  }

  if (pendingReportsCount > 0) {
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "review",
      title: "Review pending reports",
      description: `${pendingReportsCount} report(s) awaiting approval`,
      priority: "medium",
      at,
      relatedResourceType: "reports_pending",
      relatedResourceId: "list",
    });
  }

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
    const firstWithResource = highRisks.find((r) => r.resourceType && r.resourceId);
    actions.push({
      id: uuid(),
      projectId,
      tenantId,
      type: "review",
      title: "Review high-priority risks",
      description: highRisks.map((r) => r.title).join("; "),
      priority: "high",
      at,
      relatedResourceType: firstWithResource?.resourceType,
      relatedResourceId: firstWithResource?.resourceId,
    });
  }

  return actions;
}
