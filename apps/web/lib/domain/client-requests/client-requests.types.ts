/** Explicit finite kinds — no free-form ticket types. */
export type ClientRequestKind =
  | "approve_or_reject"
  | "feedback"
  | "acknowledge"
  | "choice"
  | "document_review";

export type ClientRequestActionMode = "action_required" | "info_only";

export type ClientRequestStatus = "open" | "responded" | "completed" | "cancelled";

export type ClientRequestEventType = "created" | "responded" | "completed" | "cancelled" | "updated";

export interface ProjectClientRequestRow {
  id: string;
  tenant_id: string;
  project_id: string;
  kind: ClientRequestKind;
  action_mode: ClientRequestActionMode;
  status: ClientRequestStatus;
  title: string;
  instructions: string | null;
  choice_options: unknown;
  linked_entity_type: "document" | "milestone" | null;
  linked_entity_id: string | null;
  requested_by: string | null;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  response_value: string | null;
  response_note: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectClientRequestEventRow {
  id: string;
  tenant_id: string;
  project_id: string;
  request_id: string;
  actor_user_id: string | null;
  event_type: ClientRequestEventType;
  payload: Record<string, unknown> | null;
  created_at: string;
}

/** Stakeholder-safe shape (no internal user ids). */
export interface ClientRequestPublic {
  id: string;
  kind: ClientRequestKind;
  action_mode: ClientRequestActionMode;
  status: ClientRequestStatus;
  title: string;
  instructions: string | null;
  choice_options: string[] | null;
  linked_entity_type: "document" | "milestone" | null;
  linked_entity_id: string | null;
  requested_at: string;
  responded_at: string | null;
  response_value: string | null;
  response_note: string | null;
  completed_at: string | null;
}

/** Manager view — includes actor ids for audit. */
export interface ClientRequestManager extends ClientRequestPublic {
  requested_by: string | null;
  responded_by: string | null;
  cancelled_by: string | null;
  completed_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientRequestEventPublic {
  id: string;
  event_type: ClientRequestEventType;
  created_at: string;
  payload: Record<string, unknown> | null;
}

export interface CreateClientRequestInput {
  kind: ClientRequestKind;
  action_mode?: ClientRequestActionMode;
  title: string;
  instructions?: string | null;
  choice_options?: string[] | null;
  linked_entity_type?: "document" | "milestone" | null;
  linked_entity_id?: string | null;
}

export interface RespondToClientRequestInput {
  decision?: "approve" | "reject";
  feedback_text?: string;
  acknowledged?: boolean;
  choice_index?: number;
  document_review_confirmed?: boolean;
  note?: string | null;
}

export type ManagerPatchClientRequest = { status: "completed" } | { status: "cancelled" };
