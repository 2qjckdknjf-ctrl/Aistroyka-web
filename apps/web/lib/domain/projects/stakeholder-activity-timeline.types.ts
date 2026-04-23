/**
 * Wave 4 Step 9 — Stakeholder / portal activity timeline (read model).
 * Not notifications; not chat. Audience-shaped at read time.
 */

export type StakeholderActivityEventType =
  | "client_request_created"
  | "client_request_responded"
  | "client_request_completed"
  | "client_request_cancelled"
  | "client_request_updated"
  | "stakeholder_invite_sent"
  | "stakeholder_joined_portal"
  | "discussion_opened"
  | "discussion_resolved"
  | "change_order_opened"
  | "change_order_implemented"
  | "handover_ready"
  | "handed_over"
  | "project_completed";

/** Visibility of a row before server-side shaping. */
export type StakeholderActivityVisibility = "internal" | "stakeholder" | "both";

export interface StakeholderActivityItem {
  id: string;
  eventType: StakeholderActivityEventType;
  occurredAt: string;
  title: string;
  description: string | null;
  projectId: string;
  targetUrl: string | null;
  /** Present only for manager/audit responses; stripped for stakeholder audience. */
  actorId: string | null;
  visibility: StakeholderActivityVisibility;
  /** Portal UI: emphasize when a response is still expected. */
  actionNeeded: boolean;
}

/** JSON for external stakeholders — never includes actorId. */
export type StakeholderActivityPublicItem = Omit<StakeholderActivityItem, "actorId" | "visibility">;
