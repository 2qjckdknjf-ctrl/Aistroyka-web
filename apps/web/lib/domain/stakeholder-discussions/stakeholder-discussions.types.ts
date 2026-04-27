export type StakeholderDiscussionKind =
  | "document_clarification"
  | "milestone_decision"
  | "request_followup"
  | "general";

export type StakeholderDiscussionStatus =
  | "open"
  | "awaiting_stakeholder"
  | "awaiting_manager"
  | "resolved"
  | "closed";

export type StakeholderDiscussionEntryKind =
  | "question"
  | "clarification"
  | "option_selected"
  | "feedback"
  | "resolution_note";

export type StakeholderDiscussionLinkedType = "document" | "milestone" | "client_request";

export interface StakeholderDiscussionRow {
  id: string;
  tenant_id: string;
  project_id: string;
  kind: StakeholderDiscussionKind;
  status: StakeholderDiscussionStatus;
  title: string;
  context: string | null;
  linked_entity_type: StakeholderDiscussionLinkedType | null;
  linked_entity_id: string | null;
  created_by: string;
  resolved_at: string | null;
  resolution_summary: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderDiscussionEntryRow {
  id: string;
  tenant_id: string;
  project_id: string;
  discussion_id: string;
  author_user_id: string;
  entry_kind: StakeholderDiscussionEntryKind;
  body: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface StakeholderDiscussionListItem {
  id: string;
  kind: StakeholderDiscussionKind;
  status: StakeholderDiscussionStatus;
  title: string;
  context: string | null;
  linked_entity_type: StakeholderDiscussionLinkedType | null;
  linked_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderDiscussionDetail extends StakeholderDiscussionListItem {
  created_by: string;
  resolved_at: string | null;
  resolution_summary: string | null;
  resolved_by: string | null;
  entries: StakeholderDiscussionEntryPublic[];
}

/** Stakeholder-safe entry (no internal-only fields). */
export interface StakeholderDiscussionEntryPublic {
  id: string;
  entry_kind: StakeholderDiscussionEntryKind;
  body: string;
  created_at: string;
}

export interface StakeholderDiscussionDetailManager extends StakeholderDiscussionDetail {
  entries: StakeholderDiscussionEntryRow[];
}

/** Portal-safe detail: no author ids, no internal actor metadata on discussion. */
export interface StakeholderDiscussionPublicDetail {
  id: string;
  kind: StakeholderDiscussionKind;
  status: StakeholderDiscussionStatus;
  title: string;
  context: string | null;
  linked_entity_type: StakeholderDiscussionLinkedType | null;
  linked_entity_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_summary: string | null;
  entries: StakeholderDiscussionEntryPublic[];
}
