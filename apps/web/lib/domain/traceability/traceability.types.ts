/**
 * Wave 4 Step 19 — curated audit / traceability read model (not raw DB logs).
 * Unified shape for append-only workflow events and auditable discussion entries.
 */

export type TraceActorType = "user" | "system";

/** Who can see this row under normal RLS (explainability; API still enforces auth). */
export type TraceAudience = "internal_workspace" | "stakeholder_visible";

export type TraceEntityType =
  | "change_order"
  | "handover"
  | "defect"
  | "aftercare_request"
  | "discussion"
  | "discussion_entry"
  | "document"
  | "report_approval";

export type TraceSource =
  | "project_change_order_events"
  | "project_handover_events"
  | "project_defect_events"
  | "project_service_request_events"
  | "project_stakeholder_discussion_entries"
  | "project_document_events"
  | "report_approval_events";

/** Optional cross-entity pointer backed by FK columns on domain rows (not guessed). */
export interface TraceLinkedPointer {
  entityType: TraceEntityType | "client_request" | "milestone";
  entityId: string;
  /** Short human label for UI (e.g. "Linked discussion"). */
  role: "cause" | "context" | "consequence" | "related";
}

export interface TraceItem {
  id: string;
  occurredAt: string;
  entityType: TraceEntityType;
  entityId: string;
  /** Verb or transition label, e.g. status_transition, document_lifecycle, discussion_entry */
  action: string;
  title: string;
  summary: string | null;
  previousState: string | null;
  newState: string | null;
  actorType: TraceActorType;
  actorId: string | null;
  /** Reserved for future safe display resolution; never expose unrelated PII. */
  actorLabel: string | null;
  reasonNote: string | null;
  audience: TraceAudience;
  source: TraceSource;
  /** Deep link for managers (internal workspace). */
  targetUrl: string | null;
  linkedPointers: TraceLinkedPointer[];
}

export interface TraceSummary {
  projectId: string;
  tenantId: string;
  /** Newest first */
  items: TraceItem[];
  truncated: boolean;
}
