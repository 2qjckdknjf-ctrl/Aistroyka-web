import type { ClientRequestPublic } from "@/lib/domain/client-requests/client-requests.types";
import type { CustomerEstimatePublic } from "@/lib/domain/customer-estimates/customer-estimates.types";

/** Customer-safe milestone (no internal description). */
export interface ClientVisibleMilestone {
  id: string;
  title: string;
  target_date: string;
  status: string;
}

/** Customer-safe document metadata (no storage path, no audit fields). */
export interface ClientVisibleDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  updated_at: string;
}

export type ClientDecisionKind = "document_review_needed" | "changes_requested";

/** Actionable item for the customer (visible document pending input). */
export interface ClientDecisionItem {
  id: string;
  title: string;
  type: string;
  kind: ClientDecisionKind;
}

/** Assembled read model for project owners when portal is enabled. */
export interface ClientProjectView {
  project: { id: string; name: string };
  progress: {
    tasks_done: number;
    tasks_total: number;
  };
  milestones: ClientVisibleMilestone[];
  documents: ClientVisibleDocument[];
  decisions: ClientDecisionItem[];
  /** Customer-facing estimate proposals (status sent+). */
  customer_estimates: CustomerEstimatePublic[];
  /** Explicit manager-created requests (Wave 4 Step 6); excludes cancelled. */
  client_requests: ClientRequestPublic[];
  /** Wave 4 Step 7: external stakeholder roles may be view-only. */
  capabilities: {
    can_respond_to_requests: boolean;
  };
  /** Wave 4 Step 12 — customer-safe completion state. */
  handover: {
    status: "in_progress" | "handover_ready" | "handed_over" | "completed";
    handover_notes: string | null;
    handed_over_at: string | null;
    completed_at: string | null;
  } | null;
}
