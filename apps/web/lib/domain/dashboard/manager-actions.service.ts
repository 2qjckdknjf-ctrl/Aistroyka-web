import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { buildManagerWorkload } from "@/lib/domain/workload/workload.service";
import type { WorkloadItem, WorkloadKind, WorkloadPriority } from "@/lib/domain/workload/workload.types";

export type ManagerActionType =
  | "missing_evidence"
  | "overdue_task"
  | "milestone_at_risk"
  | "approval_pending"
  | "document_review"
  | "internal_cost_overrun"
  | "customer_estimate_pending"
  | "customer_decision_pending"
  | "upload_problem"
  | "ai_risk"
  | "system_alert";

export type ManagerActionSeverity = "low" | "medium" | "high" | "critical";

export interface ManagerActionItem {
  id: string;
  type: ManagerActionType;
  severity: ManagerActionSeverity;
  title: string;
  reason: string;
  project_id: string;
  project_name?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  href: string;
  recommended_action: string;
  visibility: "internal_manager_only";
  created_at?: string;
}

export interface ManagerActionsResult {
  items: ManagerActionItem[];
  counts: Record<ManagerActionSeverity, number>;
}

const MAX_MANAGER_ACTIONS = 20;

function actionTypeForWorkload(kind: WorkloadKind): ManagerActionType {
  switch (kind) {
    case "pending_reports_queue":
      return "approval_pending";
    case "pending_document_decisions":
      return "document_review";
    case "overdue_milestones":
    case "blocking_punch_defects":
    case "handover_not_ready":
      return "milestone_at_risk";
    case "budget_over_planned":
      return "internal_cost_overrun";
    case "aftercare_needs_action":
    case "discussion_awaiting_manager":
    case "client_request_action":
    case "discussion_awaiting_stakeholder":
      return "customer_decision_pending";
    case "recurring_handover_nudge":
    case "recurring_defects_nudge":
    case "recurring_discussion_stale":
    case "recurring_aftercare_review":
    case "governance_escalation":
    case "portfolio_critical":
      return "system_alert";
  }
}

function severityForPriority(priority: WorkloadPriority, kind: WorkloadKind): ManagerActionSeverity {
  if (kind === "budget_over_planned" || priority === "urgent") return "critical";
  if (priority === "high") return "high";
  return "medium";
}

function recommendedActionForKind(kind: WorkloadKind): string {
  switch (kind) {
    case "pending_reports_queue":
      return "Review the oldest submitted reports and approve, reject, or request changes.";
    case "pending_document_decisions":
      return "Open the document queue and clear pending approval decisions.";
    case "overdue_milestones":
      return "Open the schedule tab and update owner, dates, or blockers for overdue milestones.";
    case "budget_over_planned":
      return "Open the internal Costs tab and review actual costs against planned totals.";
    case "blocking_punch_defects":
      return "Open the punch list and resolve blockers before handover.";
    case "aftercare_needs_action":
      return "Triage open aftercare requests and assign the next owner.";
    case "discussion_awaiting_manager":
      return "Respond to the structured discussion and unblock the stakeholder thread.";
    case "handover_not_ready":
      return "Open the project overview and clear handover readiness blockers.";
    case "governance_escalation":
      return "Open the governance case and record the next decision.";
    case "portfolio_critical":
      return "Open portfolio control and review critical project risks.";
    case "client_request_action":
    case "discussion_awaiting_stakeholder":
      return "Review the customer-facing request and decide the next internal action.";
    case "recurring_handover_nudge":
    case "recurring_defects_nudge":
    case "recurring_discussion_stale":
    case "recurring_aftercare_review":
      return "Open the linked project and resolve the recurring reminder condition.";
  }
}

function toManagerAction(item: WorkloadItem): ManagerActionItem {
  return {
    id: item.id,
    type: actionTypeForWorkload(item.kind),
    severity: severityForPriority(item.priority, item.kind),
    title: item.title,
    reason: item.reason,
    project_id: item.project_id ?? "tenant-wide",
    ...(item.project_name ? { project_name: item.project_name } : {}),
    ...(item.linked_entity_type ? { linked_entity_type: item.linked_entity_type } : {}),
    ...(item.linked_entity_id ? { linked_entity_id: item.linked_entity_id } : {}),
    href: item.action_url,
    recommended_action: recommendedActionForKind(item.kind),
    visibility: "internal_manager_only",
  };
}

function countBySeverity(items: ManagerActionItem[]): ManagerActionsResult["counts"] {
  return {
    low: items.filter((item) => item.severity === "low").length,
    medium: items.filter((item) => item.severity === "medium").length,
    high: items.filter((item) => item.severity === "high").length,
    critical: items.filter((item) => item.severity === "critical").length,
  };
}

export async function buildManagerActions(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<ManagerActionsResult> {
  const workload = await buildManagerWorkload(supabase, ctx);
  const items = workload.items.slice(0, MAX_MANAGER_ACTIONS).map(toManagerAction);
  return { items, counts: countBySeverity(items) };
}
