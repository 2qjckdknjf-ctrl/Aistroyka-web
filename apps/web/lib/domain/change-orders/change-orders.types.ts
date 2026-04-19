export type ChangeOrderKind =
  | "owner_variation"
  | "manager_proposed"
  | "document_linked"
  | "decision_derived"
  | "other";

export type ChangeOrderStatus =
  | "draft"
  | "proposed"
  | "under_review"
  | "approved"
  | "rejected"
  | "implemented"
  | "archived";

export type ScheduleImpactLevel = "none" | "minor_shift" | "deadline_shift" | "major_shift";

export type BudgetImpactLevel = "none" | "minor_increase" | "major_increase" | "tbd";

export interface ChangeOrderRow {
  id: string;
  tenant_id: string;
  project_id: string;
  kind: ChangeOrderKind;
  status: ChangeOrderStatus;
  title: string;
  description: string | null;
  schedule_impact_level: ScheduleImpactLevel;
  budget_impact_level: BudgetImpactLevel;
  schedule_impact_summary: string | null;
  budget_impact_summary: string | null;
  schedule_delta_days: number | null;
  budget_delta_amount: number | null;
  linked_discussion_id: string | null;
  linked_document_id: string | null;
  linked_request_id: string | null;
  linked_milestone_id: string | null;
  created_by: string;
  implemented_at: string | null;
  implemented_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChangeOrderListItem {
  id: string;
  kind: ChangeOrderKind;
  status: ChangeOrderStatus;
  title: string;
  schedule_impact_level: ScheduleImpactLevel;
  budget_impact_level: BudgetImpactLevel;
  updated_at: string;
}

export interface ChangeOrderEventRow {
  id: string;
  change_order_id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  note: string | null;
  created_at: string;
}

/** Stakeholder-safe row (no internal actor ids on events). */
export interface ChangeOrderEventPublic {
  id: string;
  from_status: string | null;
  to_status: string;
  /** Always null for stakeholders — internal notes are manager-only. */
  note: string | null;
  created_at: string;
}

export interface ChangeOrderDetailManager extends ChangeOrderRow {
  events: ChangeOrderEventRow[];
}

/** Portal-safe detail: no created_by / implemented_by / event actor ids. */
export interface ChangeOrderPublicDetail {
  id: string;
  kind: ChangeOrderKind;
  status: ChangeOrderStatus;
  title: string;
  description: string | null;
  schedule_impact_level: ScheduleImpactLevel;
  budget_impact_level: BudgetImpactLevel;
  schedule_impact_summary: string | null;
  budget_impact_summary: string | null;
  schedule_delta_days: number | null;
  budget_delta_amount: number | null;
  has_linked_discussion: boolean;
  has_linked_document: boolean;
  has_linked_request: boolean;
  has_linked_milestone: boolean;
  implemented_at: string | null;
  created_at: string;
  updated_at: string;
  events: ChangeOrderEventPublic[];
}
