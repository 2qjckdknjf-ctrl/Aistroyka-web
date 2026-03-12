/**
 * Incoming webhook handler: validate, optional replay check, map to domain event and publish.
 */

import type { DomainEventType } from "@/lib/events/event.types";
import type { IncomingWebhookPayload, WebhookEventType, WebhookHandleResult } from "./webhook.types";
import { createDomainEvent, publishDomainEvent } from "@/lib/events";

function mapEventType(type: string | undefined): WebhookEventType {
  const t = (type ?? "").toLowerCase();
  if (t === "report.submitted") return "report.submitted";
  if (t === "task.overdue") return "task.overdue";
  if (t === "risk.detected") return "risk.detected";
  if (t === "evidence.missing") return "evidence.missing";
  if (t === "project.health_degraded") return "project.health_degraded";
  if (t === "workflow.triggered") return "workflow.triggered";
  return "unknown";
}

const WEBHOOK_TO_DOMAIN: Partial<Record<WebhookEventType, DomainEventType>> = {
  "report.submitted": "report_submitted",
  "task.overdue": "task_overdue",
  "risk.detected": "risk_detected",
  "evidence.missing": "evidence_missing",
  "project.health_degraded": "project_health_degraded",
  "workflow.triggered": "workflow_triggered",
};

export interface HandleIncomingWebhookOptions {
  tenantId: string;
  projectId?: string | null;
  /** If provided, reject when key already seen (replay protection). */
  isReplay?: (key: string) => Promise<boolean> | boolean;
}

/**
 * Handle verified incoming webhook: map to domain event, publish, return result.
 */
export async function handleIncomingWebhook(
  payload: IncomingWebhookPayload,
  options: HandleIncomingWebhookOptions
): Promise<WebhookHandleResult> {
  const eventType = mapEventType(payload.type);
  const idempotencyKey = payload.idempotency_key ?? payload.id;

  if (typeof idempotencyKey === "string" && options.isReplay) {
    const replay = await Promise.resolve(options.isReplay(idempotencyKey));
    if (replay) {
      return { accepted: false, eventType, error: "replay" };
    }
  }

  const domainEventType: DomainEventType =
    (eventType !== "unknown" ? WEBHOOK_TO_DOMAIN[eventType] : undefined) ?? "report_submitted";

  const event = createDomainEvent(
    domainEventType,
    options.tenantId,
    "system",
    {
      webhook_type: payload.type,
      idempotency_key: idempotencyKey,
      ...payload.data,
    },
    options.projectId ?? undefined
  );
  await publishDomainEvent(event);

  return {
    accepted: true,
    eventType,
    eventId: event.id,
  };
}
