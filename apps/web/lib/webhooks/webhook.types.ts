/**
 * Webhook foundation — incoming and outgoing types.
 */

export type WebhookEventType =
  | "report.submitted"
  | "task.overdue"
  | "risk.detected"
  | "evidence.missing"
  | "project.health_degraded"
  | "workflow.triggered"
  | "unknown";

export interface IncomingWebhookPayload {
  id?: string;
  type?: string;
  created?: string;
  data?: Record<string, unknown>;
  /** For replay protection: unique id per event */
  idempotency_key?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
  /** Parsed payload when valid */
  payload?: IncomingWebhookPayload;
}

export interface WebhookHandleResult {
  accepted: boolean;
  eventType: WebhookEventType;
  error?: string;
  /** If accepted and domain event was published */
  eventId?: string;
}

/** Outgoing event shape (for future delivery). */
export interface OutgoingWebhookEvent {
  id: string;
  type: string;
  created: string;
  tenantId: string;
  projectId?: string | null;
  data: Record<string, unknown>;
}
