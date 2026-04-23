export type ServiceRequestStatus =
  | "reported"
  | "triaged"
  | "in_progress"
  | "resolved"
  | "closed";

/** Construction-relevant warranty / commercial coverage — not an SLA engine. */
export type ServiceRequestCoverageType = "warranty_covered" | "warranty_review_needed" | "not_warranty";

export interface ServiceRequestRow {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: ServiceRequestStatus;
  coverage_type: ServiceRequestCoverageType;
  assigned_to: string | null;
  due_date: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  linked_handover_id: string | null;
  linked_defect_id: string | null;
  linked_discussion_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestListItem {
  id: string;
  title: string;
  status: ServiceRequestStatus;
  coverage_type: ServiceRequestCoverageType;
  due_date: string | null;
  updated_at: string;
}

export interface ServiceRequestEventRow {
  id: string;
  service_request_id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  note: string | null;
  created_at: string;
}

/** Stakeholder-safe detail — no assignee, no transition notes, no event history. */
export interface ServiceRequestPublicDetail {
  id: string;
  title: string;
  description: string | null;
  status: ServiceRequestStatus;
  coverage_type: ServiceRequestCoverageType;
  due_date: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  /** Optional deep links for transparency (IDs are already in URLs elsewhere). */
  linked_defect_id: string | null;
  linked_discussion_id: string | null;
}
