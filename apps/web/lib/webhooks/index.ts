/**
 * Webhook foundation — verification, handling, domain event integration.
 */

export type {
  WebhookEventType,
  IncomingWebhookPayload,
  WebhookVerificationResult,
  WebhookHandleResult,
  OutgoingWebhookEvent,
} from "./webhook.types";
export {
  verifyIncomingWebhook,
  getReplayKey,
  type WebhookVerifierOptions,
  type ReplayCheckResult,
} from "./webhook-verifier";
export {
  handleIncomingWebhook,
  type HandleIncomingWebhookOptions,
} from "./webhook-handler";
