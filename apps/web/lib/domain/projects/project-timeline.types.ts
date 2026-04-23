/**
 * Project timeline / activity feed — MVP
 *
 * Unified read-model. No event bus, no audit platform.
 * See docs/project-timeline-activity-feed-mvp.md.
 */

/** Timeline event types. */
export type TimelineEventType =
  | "issue_created"
  | "issue_status_changed"
  | "issue_resolved"
  | "report_submitted"
  | "document_submitted_for_review"
  | "document_resubmitted_for_review"
  | "owner_decision_approved"
  | "owner_decision_rejected"
  | "owner_decision_changes_requested"
  | "task_assigned"
  | "task_completed"
  | "service_request_reported"
  | "service_request_resolved";

/** Related entity type. */
export type TimelineEntityType = "issue" | "report" | "document" | "task" | "service_request";

/** Unified timeline item. */
export interface TimelineItem {
  id: string;
  eventType: TimelineEventType;
  occurredAt: string;
  actorId?: string | null;
  actorLabel?: string | null;
  title: string;
  description?: string | null;
  projectId: string;
  entityType: TimelineEntityType;
  entityId: string;
  /** Route for link. */
  targetUrl?: string | null;
}
