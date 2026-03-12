# Webhook Foundation

## Overview

Foundation for **incoming webhooks** (and direction for outgoing): signature verification, payload validation, replay protection, and **publishDomainEvent** integration so that accepted webhooks produce domain events.

## Structure

| File | Role |
|------|------|
| `lib/webhooks/webhook.types.ts` | `WebhookEventType`, `IncomingWebhookPayload`, `WebhookVerificationResult`, `WebhookHandleResult`, `OutgoingWebhookEvent` |
| `lib/webhooks/webhook-verifier.ts` | `verifyIncomingWebhook(request, bodyText, options)` — HMAC SHA-256 when secret set; body size limit; `getReplayKey(payload)` |
| `lib/webhooks/webhook-handler.ts` | `handleIncomingWebhook(payload, options)` — map to domain event type, optional replay check, `createDomainEvent` + `publishDomainEvent` |
| `app/api/webhooks/incoming/route.ts` | POST: content-type check → verify → tenant from body/header → handle → JSON response |

## Verification

- **Signature:** If `WEBHOOK_INCOMING_SECRET` is set, header `x-webhook-signature` must be `sha256=<hex(hmac-sha256(secret, rawBody))`. Without secret, verification passes (scaffold).
- **Payload:** JSON only; max body size 256KB (configurable via `maxBodySize`).
- **Replay:** Caller can pass `isReplay(key)` in `handleIncomingWebhook`; key from `payload.idempotency_key` or `payload.id`. No built-in store; direction for idempotency store is documented.

## Event mapping

Webhook `type` (e.g. `report.submitted`) is mapped to `DomainEventType` (`report_submitted`) and published via `publishDomainEvent`. Unknown types default to `report_submitted`. Payload `data` (and tenantId/projectId) are passed in the event payload.

## What is real vs scaffold

- **Real:** Verification (HMAC when secret set), JSON and size validation, tenant from body/header, domain event creation and publish, typed result.
- **Scaffold:** No default replay store (caller can pass `isReplay`); without `WEBHOOK_INCOMING_SECRET`, signature is not enforced. Outgoing webhook delivery is not implemented (only types and adapter scaffold in integration layer).

## Extension points

1. **Replay store:** Implement a store (e.g. Redis/DB) and pass `isReplay: (key) => store.has(key)` (and set key after success).
2. **Outgoing:** Use `OutgoingWebhookEvent` and webhook adapter (or a dedicated sender) to POST to tenant-configured URLs with signature.
3. **More event types:** Extend `WebhookEventType` and `WEBHOOK_TO_DOMAIN` in the handler.
